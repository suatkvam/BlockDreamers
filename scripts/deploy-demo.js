const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  const [sponsor, user1, user2] = await ethers.getSigners();

  const PrizeToken = await ethers.getContractFactory("PrizeToken");
  const token = await PrizeToken.deploy(ethers.parseUnits("1000000", 18));
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
  const prizeAmount = ethers.parseUnits("100", 18);
  const ticketCap = 10;
  const duration = 300;

  const draw = await PrizeDraw.deploy(tokenAddress, prizeAmount, ticketCap, duration);
  await draw.waitForDeployment();
  const drawAddress = await draw.getAddress();

  await token.connect(sponsor).approve(drawAddress, prizeAmount);
  await draw.connect(sponsor).fundDraw(prizeAmount);

  console.log("Sponsor:", sponsor.address);
  console.log("PrizeToken:", tokenAddress);
  console.log("PrizeDraw:", drawAddress);
  console.log("Status:", (await draw.status()).toString());
  console.log("Funded:", ethers.formatUnits(await draw.fundedAmount(), 18));

  await draw.connect(user1).mintTicket();
  await draw.connect(user2).mintTicket();

  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  console.log("Participant count:", (await draw.participantCount()).toString());

  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    prizeTokenAddress: tokenAddress,
    prizeDrawAddress: drawAddress,
    sponsor: sponsor.address,
    participants: [user1.address, user2.address],
    duration
  };
  fs.writeFileSync(
    path.join(__dirname, "..", "deployment.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\nDemo ready. Wait for close, then call executeDraw().");
  console.log("Deployment info written to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
