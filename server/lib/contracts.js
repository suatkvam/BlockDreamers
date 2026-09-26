const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");

const prizeTokenAbi = require("../abi/PrizeToken.json");
const prizeDrawAbi = require("../abi/PrizeDraw.json");

function loadDeployment() {
  const deploymentPath = path.join(__dirname, "..", "..", "deployment.json");
  if (fs.existsSync(deploymentPath)) {
    return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }
  return {};
}

const deployment = loadDeployment();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIZE_TOKEN_ADDRESS = process.env.PRIZE_TOKEN_ADDRESS || deployment.prizeTokenAddress;
const PRIZE_DRAW_ADDRESS = process.env.PRIZE_DRAW_ADDRESS || deployment.prizeDrawAddress;

if (!PRIZE_TOKEN_ADDRESS || !PRIZE_DRAW_ADDRESS) {
  console.warn(
    "Warning: PRIZE_TOKEN_ADDRESS / PRIZE_DRAW_ADDRESS not set and deployment.json missing. " +
      "Run `npm run deploy:demo` or set env vars."
  );
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

// Demo-only signer roles. Local Anvil/Hardhat private keys only, never mainnet keys.
const SIGNER_KEYS = {
  sponsor: process.env.SPONSOR_PRIVATE_KEY,
  participantA: process.env.PARTICIPANT_A_PRIVATE_KEY,
  participantB: process.env.PARTICIPANT_B_PRIVATE_KEY
};

function getSigner(role) {
  const key = SIGNER_KEYS[role];
  if (!key) {
    throw Object.assign(new Error(`No private key configured for role "${role}"`), { status: 400 });
  }
  return new ethers.Wallet(key, provider);
}

function getReadDraw() {
  return new ethers.Contract(PRIZE_DRAW_ADDRESS, prizeDrawAbi, provider);
}

function getReadToken() {
  return new ethers.Contract(PRIZE_TOKEN_ADDRESS, prizeTokenAbi, provider);
}

function getDrawAs(role) {
  return new ethers.Contract(PRIZE_DRAW_ADDRESS, prizeDrawAbi, getSigner(role));
}

function getTokenAs(role) {
  return new ethers.Contract(PRIZE_TOKEN_ADDRESS, prizeTokenAbi, getSigner(role));
}

module.exports = {
  provider,
  getReadDraw,
  getReadToken,
  getDrawAs,
  getTokenAs,
  getSigner,
  PRIZE_TOKEN_ADDRESS,
  PRIZE_DRAW_ADDRESS
};
