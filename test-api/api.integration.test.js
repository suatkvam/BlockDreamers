const { expect } = require("chai");
const { spawn } = require("child_process");
const path = require("path");
const { ethers } = require("ethers");

const RPC_PORT = 8555;
const RPC_URL = `http://127.0.0.1:${RPC_PORT}`;
const API_PORT = 4101;
const API_URL = `http://127.0.0.1:${API_PORT}`;

// Well-known local Hardhat/Anvil test keys. Never used on a real network.
const KEYS = {
  sponsor: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  participantA: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  participantB: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
};

let nodeProcess;
let server;
let provider;
let tokenAddress;
let drawAddress;

async function waitForRpc(prov) {
  for (let i = 0; i < 40; i++) {
    try {
      await prov.getBlockNumber();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("hardhat node did not become ready in time");
}

async function api(method, urlPath, body) {
  const res = await fetch(`${API_URL}${urlPath}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  return { status: res.status, data };
}

async function advanceTime(seconds) {
  await provider.send("evm_increaseTime", [seconds]);
  await provider.send("evm_mine", []);
}

// Hardhat's mined-block timestamp can take a beat to become visible over a
// separate JSON-RPC connection (the API server's own provider). Poll the
// same read path a client would use instead of assuming instant consistency.
async function waitForStatusLabel(label, timeoutMs = 5000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    const { data } = await api("GET", "/api/event");
    last = data.statusLabel;
    if (last === label) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`status never reached "${label}", last seen "${last}"`);
}

describe("MonadDraw API (integration, real local chain)", function () {
  this.timeout(120000);

  before(async function () {
    const root = path.join(__dirname, "..");

    nodeProcess = spawn(path.join(root, "node_modules/.bin/hardhat"), ["node", "--port", String(RPC_PORT)], {
      cwd: root,
      stdio: "ignore",
      detached: true
    });

    provider = new ethers.JsonRpcProvider(RPC_URL);
    await waitForRpc(provider);

    const sponsorWallet = new ethers.Wallet(KEYS.sponsor, provider);

    const tokenArtifact = require(path.join(root, "artifacts/contracts/PrizeToken.sol/PrizeToken.json"));
    const drawArtifact = require(path.join(root, "artifacts/contracts/PrizeDraw.sol/PrizeDraw.json"));

    let nonce = await provider.getTransactionCount(sponsorWallet.address);

    const TokenFactory = new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode, sponsorWallet);
    const token = await TokenFactory.deploy(ethers.parseUnits("1000000", 18), { nonce: nonce++ });
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();

    const prizeAmount = ethers.parseUnits("100", 18);
    const ticketCap = 5;
    const duration = 3600; // long window; the test closes it explicitly via evm_increaseTime

    const DrawFactory = new ethers.ContractFactory(drawArtifact.abi, drawArtifact.bytecode, sponsorWallet);
    const draw = await DrawFactory.deploy(tokenAddress, prizeAmount, ticketCap, duration, { nonce: nonce++ });
    await draw.waitForDeployment();
    drawAddress = await draw.getAddress();

    await (await token.connect(sponsorWallet).approve(drawAddress, prizeAmount, { nonce: nonce++ })).wait();
    await (await draw.connect(sponsorWallet).fundDraw(prizeAmount, { nonce: nonce++ })).wait();

    process.env.RPC_URL = RPC_URL;
    process.env.PRIZE_TOKEN_ADDRESS = tokenAddress;
    process.env.PRIZE_DRAW_ADDRESS = drawAddress;
    process.env.SPONSOR_PRIVATE_KEY = KEYS.sponsor;
    process.env.PARTICIPANT_A_PRIVATE_KEY = KEYS.participantA;
    process.env.PARTICIPANT_B_PRIVATE_KEY = KEYS.participantB;

    const app = require(path.join(root, "server/app"));
    await new Promise((resolve) => {
      server = app.listen(API_PORT, resolve);
    });
  });

  after(async function () {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (nodeProcess) {
      try {
        process.kill(-nodeProcess.pid, "SIGKILL");
      } catch {
        nodeProcess.kill("SIGKILL");
      }
    }
  });

  it("GET /api/health returns ok", async function () {
    const { status, data } = await api("GET", "/api/health");
    expect(status).to.equal(200);
    expect(data).to.deep.equal({ ok: true });
  });

  it("GET /api/event reflects funded, open draw", async function () {
    const { status, data } = await api("GET", "/api/event");
    expect(status).to.equal(200);
    expect(data.statusLabel).to.equal("Open");
    expect(data.prizeTokenSymbol).to.equal("DPRZ");
    expect(data.prizeAmount).to.equal(ethers.parseUnits("100", 18).toString());
    expect(data.fundedAmount).to.equal(data.prizeAmount);
    expect(data.participantCount).to.equal("0");
    expect(data.winner).to.equal(ethers.ZeroAddress);
  });

  it("GET /api/event/participants starts empty", async function () {
    const { status, data } = await api("GET", "/api/event/participants");
    expect(status).to.equal(200);
    expect(data.participants).to.deep.equal([]);
  });

  it("GET /api/event/participants/:address reports non-participant", async function () {
    const randomAddr = ethers.Wallet.createRandom().address;
    const { status, data } = await api("GET", `/api/event/participants/${randomAddr}`);
    expect(status).to.equal(200);
    expect(data.isParticipant).to.equal(false);
  });

  it("POST /api/event/mint requires 'as'", async function () {
    const { status, data } = await api("POST", "/api/event/mint", {});
    expect(status).to.equal(400);
    expect(data.error).to.match(/as \(signer role\)/);
  });

  it("POST /api/event/mint rejects unknown signer role", async function () {
    const { status, data } = await api("POST", "/api/event/mint", { as: "bogusRole" });
    expect(status).to.equal(400);
    expect(data.error).to.match(/No private key configured/);
  });

  it("POST /api/event/mint mints a ticket for participantA", async function () {
    const { status, data } = await api("POST", "/api/event/mint", { as: "participantA" });
    expect(status).to.equal(200);
    expect(data.txHash).to.match(/^0x[0-9a-f]{64}$/);

    const after = await api("GET", "/api/event/participants");
    expect(after.data.participants).to.deep.equal([await new ethers.Wallet(KEYS.participantA).getAddress()]);
  });

  it("POST /api/event/mint rejects a second ticket for the same address", async function () {
    const { status, data } = await api("POST", "/api/event/mint", { as: "participantA" });
    expect(status).to.be.at.least(400);
    expect(data.error).to.be.a("string");
  });

  it("POST /api/event/execute fails before the window closes", async function () {
    const { status } = await api("POST", "/api/event/execute", { as: "sponsor" });
    expect(status).to.be.at.least(400);
  });

  it("closes the participation window", async function () {
    await advanceTime(3700);
    const { data } = await api("GET", "/api/event");
    expect(data.statusLabel).to.equal("Closed");
  });

  it("POST /api/event/mint fails once the window is closed", async function () {
    const { status } = await api("POST", "/api/event/mint", { as: "participantB" });
    expect(status).to.be.at.least(400);
  });

  it("POST /api/event/fund fails beyond the prize amount", async function () {
    const { status, data } = await api("POST", "/api/event/fund", { amount: "1", as: "sponsor" });
    expect(status).to.be.at.least(400);
    expect(data.error).to.be.a("string");
  });

  it("POST /api/event/execute succeeds after close and selects the sole participant", async function () {
    // A real client re-checks status right before firing a state-changing
    // action rather than assuming a check performed a moment earlier still
    // holds; do the same here instead of racing the immediately-prior read.
    await waitForStatusLabel("Closed");
    await api("GET", "/api/event");
    const { status, data } = await api("POST", "/api/event/execute", { as: "sponsor" });
    expect(status).to.equal(200);
    expect(data.txHash).to.match(/^0x[0-9a-f]{64}$/);

    const event = await api("GET", "/api/event");
    expect(event.data.statusLabel).to.equal("Drawn");
    expect(event.data.winner.toLowerCase()).to.equal(
      (await new ethers.Wallet(KEYS.participantA).getAddress()).toLowerCase()
    );
    expect(event.data.drawSeed).to.not.equal(ethers.ZeroHash);
  });

  it("POST /api/event/execute cannot run twice", async function () {
    const { status } = await api("POST", "/api/event/execute", { as: "sponsor" });
    expect(status).to.be.at.least(400);
  });

  it("POST /api/event/claim requires 'as'", async function () {
    const { status } = await api("POST", "/api/event/claim", {});
    expect(status).to.equal(400);
  });

  it("POST /api/event/claim rejects the non-winner", async function () {
    const { status } = await api("POST", "/api/event/claim", { as: "sponsor" });
    expect(status).to.be.at.least(400);
  });

  it("POST /api/event/claim pays the winner and settles the event", async function () {
    const { status, data } = await api("POST", "/api/event/claim", { as: "participantA" });
    expect(status).to.equal(200);
    expect(data.txHash).to.match(/^0x[0-9a-f]{64}$/);

    const event = await api("GET", "/api/event");
    expect(event.data.statusLabel).to.equal("Settled");

    const tokenArtifact = require(path.join(__dirname, "..", "artifacts/contracts/PrizeToken.sol/PrizeToken.json"));
    const token = new ethers.Contract(tokenAddress, tokenArtifact.abi, provider);
    const balance = await token.balanceOf(await new ethers.Wallet(KEYS.participantA).getAddress());
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("POST /api/event/claim cannot run twice", async function () {
    const { status } = await api("POST", "/api/event/claim", { as: "participantA" });
    expect(status).to.be.at.least(400);
  });
});
