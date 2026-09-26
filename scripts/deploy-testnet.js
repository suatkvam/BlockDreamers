const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

// Demo parameters per live event id. Amounts are whole DPRZ (18 decimals).
// community-playtest uses a short real duration so it is already Closed by
// the time a human finishes this script's output and opens the browser --
// no artificial sleep here, just a short window and an honest close-time log.
const EVENTS = [
  { id: "builder-grant", prize: "500", cap: 128, duration: 3600 },
  { id: "docs-sprint", prize: "80", cap: 200, duration: 3600 },
  { id: "community-playtest", prize: "120", cap: 64, duration: 90 },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const PrizeToken = await ethers.getContractFactory("PrizeToken");
  const token = await PrizeToken.deploy(ethers.parseUnits("10000", 18));
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("PrizeToken:", tokenAddress);

  const network = await ethers.provider.getNetwork();
  const registry = {};

  for (const ev of EVENTS) {
    const prizeAmount = ethers.parseUnits(ev.prize, 18);
    const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
    const draw = await PrizeDraw.deploy(
      tokenAddress,
      prizeAmount,
      ev.cap,
      ev.duration,
    );
    await draw.waitForDeployment();
    const drawAddress = await draw.getAddress();

    await (await token.approve(drawAddress, prizeAmount)).wait();
    await (await draw.fundDraw(prizeAmount)).wait();

    registry[ev.id] = {
      prizeDrawAddress: drawAddress,
      prizeTokenAddress: tokenAddress,
      chainId: Number(network.chainId),
    };

    const closesAt = new Date(Date.now() + ev.duration * 1000).toISOString();
    console.log(`${ev.id}: ${drawAddress} (closes ${closesAt})`);
  }

  const outFile = path.join(__dirname, "..", "src", "config", "liveEvents.ts");
  const body = `/** Public registry of live Monad Testnet deployments, keyed by event id.
 * Committable: addresses only, never secrets. Ships empty so a fresh clone
 * builds/runs/tests fine with all 9 events on the fixture path. Overwritten
 * wholesale by \`npm run deploy:testnet\` (scripts/deploy-testnet.js) once the
 * human deploys their own contracts.
 */
export type LiveEventEntry = {
  prizeDrawAddress: string;
  prizeTokenAddress: string;
  chainId: number;
};

export const LIVE_EVENT_IDS = [
  "builder-grant",
  "docs-sprint",
  "community-playtest",
] as const;

export type LiveEventId = (typeof LIVE_EVENT_IDS)[number];

export const liveEvents: Partial<Record<LiveEventId, LiveEventEntry>> = ${JSON.stringify(registry, null, 2)};
`;
  fs.writeFileSync(outFile, body);
  console.log("\nWrote", outFile);
  console.log("Review and commit it -- addresses only, no secrets.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
