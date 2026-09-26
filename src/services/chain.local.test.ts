// Local Hardhat end-to-end regression test for chain.ts itself -- not
// MetaMask. Proves the real read/write contract-interaction logic is
// correct using a plain ethers.Wallet as Signer (satisfies the same
// Provider/Signer interfaces a real BrowserProvider would), so this runs
// fully offline/deterministically without a browser or Monad testnet.
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { ethers } from "ethers";
import * as chain from "./chain.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const require = createRequire(import.meta.url);

const RPC_PORT = 8575;
const RPC_URL = `http://127.0.0.1:${RPC_PORT}`;

const KEYS = {
  sponsor: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  participantA: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  participantB: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
};

let nodeProcess: ChildProcess;
let provider: ethers.JsonRpcProvider;
let tokenAddress: string;
let drawAddress: string;

async function waitForRpc(prov: ethers.JsonRpcProvider) {
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

before(async () => {
  nodeProcess = spawn(
    path.join(root, "node_modules/.bin/hardhat"),
    ["node", "--port", String(RPC_PORT)],
    { cwd: root, stdio: "ignore", detached: true },
  );

  provider = new ethers.JsonRpcProvider(RPC_URL);
  await waitForRpc(provider);

  const sponsorWallet = new ethers.Wallet(KEYS.sponsor, provider);
  const tokenArtifact = require(
    path.join(root, "artifacts/contracts/PrizeToken.sol/PrizeToken.json"),
  );
  const drawArtifact = require(
    path.join(root, "artifacts/contracts/PrizeDraw.sol/PrizeDraw.json"),
  );

  let nonce = await provider.getTransactionCount(sponsorWallet.address);

  const TokenFactory = new ethers.ContractFactory(
    tokenArtifact.abi,
    tokenArtifact.bytecode,
    sponsorWallet,
  );
  const token = await TokenFactory.deploy(ethers.parseUnits("1000000", 18), {
    nonce: nonce++,
  });
  await token.waitForDeployment();
  tokenAddress = await token.getAddress();

  const prizeAmount = ethers.parseUnits("100", 18);
  const ticketCap = 5;
  const duration = 3600;

  const DrawFactory = new ethers.ContractFactory(
    drawArtifact.abi,
    drawArtifact.bytecode,
    sponsorWallet,
  );
  const draw = await DrawFactory.deploy(
    tokenAddress,
    prizeAmount,
    ticketCap,
    duration,
    { nonce: nonce++ },
  );
  await draw.waitForDeployment();
  drawAddress = await draw.getAddress();
});

after(async () => {
  if (nodeProcess) {
    try {
      process.kill(-nodeProcess.pid!, "SIGKILL");
    } catch {
      nodeProcess.kill("SIGKILL");
    }
  }
});

test("chain.ts drives fund -> mint -> execute -> claim against a real local chain", async () => {
  const sponsor = new ethers.Wallet(KEYS.sponsor, provider);
  const participantA = new ethers.Wallet(KEYS.participantA, provider);
  const participantB = new ethers.Wallet(KEYS.participantB, provider);

  await chain.approve(tokenAddress, drawAddress, 100, 18, sponsor);
  await chain.fundDraw(drawAddress, 100, 18, sponsor);

  let snap = await chain.readDrawSnapshot(drawAddress, tokenAddress, provider);
  assert.equal(snap.status, "Open");
  assert.equal(snap.funded, 100);

  await chain.mintTicket(drawAddress, participantA);
  await chain.mintTicket(drawAddress, participantB);

  await assert.rejects(
    () => chain.mintTicket(drawAddress, participantA),
    /already hold a participation ticket/,
  );

  snap = await chain.readDrawSnapshot(drawAddress, tokenAddress, provider);
  assert.deepEqual(snap.participants, [participantA.address, participantB.address]);
  assert.equal(
    await chain.readIsParticipant(drawAddress, provider, participantA.address),
    true,
  );

  await provider.send("evm_increaseTime", [3700]);
  await provider.send("evm_mine", []);

  snap = await chain.readDrawSnapshot(drawAddress, tokenAddress, provider);
  assert.equal(snap.status, "Closed");

  await chain.executeDraw(drawAddress, sponsor);

  snap = await chain.readDrawSnapshot(drawAddress, tokenAddress, provider);
  assert.equal(snap.status, "Drawn");
  assert.ok(snap.winner);
  assert.ok([participantA.address, participantB.address].includes(snap.winner!));

  const winner = snap.winner === participantA.address ? participantA : participantB;
  await chain.claimPrize(drawAddress, winner);

  const balance = await chain.readTokenBalance(tokenAddress, provider, winner.address);
  assert.equal(balance, 100);

  snap = await chain.readDrawSnapshot(drawAddress, tokenAddress, provider);
  assert.equal(snap.status, "Settled");
});
