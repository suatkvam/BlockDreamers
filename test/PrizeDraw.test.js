const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("PrizeDraw", function () {
  async function deployFixture() {
    const [sponsor, alice, bob] = await ethers.getSigners();

    const PrizeToken = await ethers.getContractFactory("PrizeToken");
    const token = await PrizeToken.deploy(ethers.parseUnits("1000000", 18));
    await token.waitForDeployment();

    const prizeAmount = ethers.parseUnits("100", 18);
    const ticketCap = 5;
    const duration = 600;

    const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
    const draw = await PrizeDraw.deploy(await token.getAddress(), prizeAmount, ticketCap, duration);
    await draw.waitForDeployment();

    return { sponsor, alice, bob, token, draw, prizeAmount, ticketCap, duration };
  }

  async function fundedFixture() {
    const ctx = await deployFixture();
    const { sponsor, token, draw, prizeAmount } = ctx;
    await token.connect(sponsor).approve(await draw.getAddress(), prizeAmount);
    await draw.connect(sponsor).fundDraw(prizeAmount);
    return ctx;
  }

  describe("deployment", function () {
    it("deploys with valid parameters", async function () {
      const { draw, sponsor } = await loadFixture(deployFixture);
      expect(await draw.sponsor()).to.equal(sponsor.address);
    });

    it("reverts if prize token is zero address", async function () {
      const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
      await expect(
        PrizeDraw.deploy(ethers.ZeroAddress, ethers.parseUnits("1", 18), 1, 100)
      ).to.be.revertedWithCustomError(PrizeDraw, "InvalidToken");
    });

    it("reverts if prize amount is zero", async function () {
      const { token } = await loadFixture(deployFixture);
      const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
      await expect(
        PrizeDraw.deploy(await token.getAddress(), 0, 1, 100)
      ).to.be.revertedWithCustomError(PrizeDraw, "InvalidAmount");
    });

    it("reverts if ticket cap is zero", async function () {
      const { token } = await loadFixture(deployFixture);
      const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
      await expect(
        PrizeDraw.deploy(await token.getAddress(), ethers.parseUnits("1", 18), 0, 100)
      ).to.be.revertedWithCustomError(PrizeDraw, "InvalidCap");
    });

    it("reverts if duration is zero", async function () {
      const { token } = await loadFixture(deployFixture);
      const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
      await expect(
        PrizeDraw.deploy(await token.getAddress(), ethers.parseUnits("1", 18), 1, 0)
      ).to.be.revertedWithCustomError(PrizeDraw, "InvalidDuration");
    });
  });

  describe("funding", function () {
    it("sponsor can fund draw", async function () {
      const { draw } = await loadFixture(fundedFixture);
      expect((await draw.status()).toString()).to.equal("1");
    });

    it("non-sponsor cannot fund draw", async function () {
      const { draw, alice, prizeAmount } = await loadFixture(deployFixture);
      await expect(draw.connect(alice).fundDraw(prizeAmount)).to.be.revertedWithCustomError(
        draw,
        "NotSponsor"
      );
    });

    it("funding beyond prize amount reverts", async function () {
      const { sponsor, token, draw, prizeAmount } = await loadFixture(deployFixture);
      await token.connect(sponsor).approve(await draw.getAddress(), prizeAmount * 2n);
      await expect(draw.connect(sponsor).fundDraw(prizeAmount + 1n)).to.be.revertedWithCustomError(
        draw,
        "FundingExceedsPrize"
      );
    });

    it("zero funding amount reverts", async function () {
      const { sponsor, draw } = await loadFixture(deployFixture);
      await expect(draw.connect(sponsor).fundDraw(0)).to.be.revertedWithCustomError(
        draw,
        "InvalidAmount"
      );
    });
  });

  describe("minting", function () {
    it("cannot mint before open (not funded)", async function () {
      const { draw, alice } = await loadFixture(deployFixture);
      await expect(draw.connect(alice).mintTicket()).to.be.revertedWithCustomError(draw, "DrawNotOpen");
    });

    it("participant can mint one ticket", async function () {
      const { draw, alice } = await loadFixture(fundedFixture);
      await draw.connect(alice).mintTicket();
      expect(await draw.isParticipant(alice.address)).to.equal(true);
    });

    it("participant cannot mint twice", async function () {
      const { draw, alice } = await loadFixture(fundedFixture);
      await draw.connect(alice).mintTicket();
      await expect(draw.connect(alice).mintTicket()).to.be.revertedWithCustomError(
        draw,
        "AlreadyParticipant"
      );
    });

    it("cannot mint beyond ticket cap", async function () {
      const ctx = await loadFixture(fundedFixture);
      const { draw, ticketCap } = ctx;
      const signers = await ethers.getSigners();
      for (let i = 0; i < Number(ticketCap); i++) {
        await draw.connect(signers[i + 3]).mintTicket();
      }
      await expect(draw.connect(signers[3 + Number(ticketCap)]).mintTicket()).to.be.revertedWithCustomError(
        draw,
        "TicketCapReached"
      );
    });

    it("cannot mint after close", async function () {
      const { draw, alice, duration } = await loadFixture(fundedFixture);
      await time.increase(duration + 1);
      await expect(draw.connect(alice).mintTicket()).to.be.revertedWithCustomError(draw, "DrawNotOpen");
    });
  });

  describe("execution", function () {
    it("cannot execute before close", async function () {
      const { draw } = await loadFixture(fundedFixture);
      await expect(draw.executeDraw()).to.be.revertedWithCustomError(draw, "DrawNotClosed");
    });

    it("cannot execute with no participants", async function () {
      const { draw, duration } = await loadFixture(fundedFixture);
      await time.increase(duration + 1);
      await expect(draw.executeDraw()).to.be.revertedWithCustomError(draw, "NoParticipants");
    });

    it("executes after close and stores winner, seed, index", async function () {
      const { draw, alice, bob, duration } = await loadFixture(fundedFixture);
      await draw.connect(alice).mintTicket();
      await draw.connect(bob).mintTicket();
      await time.increase(duration + 1);

      await expect(draw.executeDraw()).to.emit(draw, "DrawExecuted");

      const winner = await draw.winner();
      expect(winner).to.be.oneOf([alice.address, bob.address]);
      expect(await draw.drawSeed()).to.not.equal(ethers.ZeroHash);
    });

    it("cannot execute twice", async function () {
      const { draw, alice, duration } = await loadFixture(fundedFixture);
      await draw.connect(alice).mintTicket();
      await time.increase(duration + 1);
      await draw.executeDraw();
      await expect(draw.executeDraw()).to.be.revertedWithCustomError(draw, "DrawNotClosed");
    });
  });

  describe("claim", function () {
    it("winner can claim and non-winner cannot", async function () {
      const { draw, alice, bob, token, prizeAmount, duration } = await loadFixture(fundedFixture);
      await draw.connect(alice).mintTicket();
      await draw.connect(bob).mintTicket();
      await time.increase(duration + 1);
      await draw.executeDraw();

      const winner = await draw.winner();
      const loser = winner === alice.address ? bob : alice;

      await expect(draw.connect(loser).claimPrize()).to.be.revertedWithCustomError(draw, "NotWinner");

      const winnerSigner = winner === alice.address ? alice : bob;
      await draw.connect(winnerSigner).claimPrize();
      expect(await token.balanceOf(winner)).to.equal(prizeAmount);
      expect((await draw.status()).toString()).to.equal("4");
    });

    it("claim cannot be called twice", async function () {
      const { draw, alice, duration } = await loadFixture(fundedFixture);
      await draw.connect(alice).mintTicket();
      await time.increase(duration + 1);
      await draw.executeDraw();
      await draw.connect(alice).claimPrize();
      await expect(draw.connect(alice).claimPrize()).to.be.revertedWithCustomError(draw, "DrawNotDrawn");
    });
  });
});
