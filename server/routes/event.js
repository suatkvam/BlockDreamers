const express = require("express");
const { ethers } = require("ethers");
const { getReadDraw, getReadToken, getDrawAs, getTokenAs } = require("../lib/contracts");

const router = express.Router();

const STATUS_LABELS = ["NotOpen", "Open", "Closed", "Drawn", "Settled", "Cancelled"];

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// GET /api/event - full transparency snapshot (spec section 9.4 / M8)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const draw = getReadDraw();
    const token = getReadToken();

    const [
      statusCode,
      sponsor,
      prizeToken,
      prizeAmount,
      fundedAmount,
      ticketCap,
      openAt,
      closeAt,
      participantCount,
      winner,
      drawSeed,
      selectedIndex,
      tokenSymbol
    ] = await Promise.all([
      draw.status(),
      draw.sponsor(),
      draw.prizeToken(),
      draw.prizeAmount(),
      draw.fundedAmount(),
      draw.ticketCap(),
      draw.openAt(),
      draw.closeAt(),
      draw.participantCount(),
      draw.winner(),
      draw.drawSeed(),
      draw.selectedIndex(),
      token.symbol()
    ]);

    res.json({
      status: Number(statusCode),
      statusLabel: STATUS_LABELS[Number(statusCode)],
      sponsor,
      prizeToken,
      prizeTokenSymbol: tokenSymbol,
      prizeAmount: prizeAmount.toString(),
      fundedAmount: fundedAmount.toString(),
      ticketCap: ticketCap.toString(),
      openAt: openAt.toString(),
      closeAt: closeAt.toString(),
      participantCount: participantCount.toString(),
      winner,
      drawSeed,
      selectedIndex: selectedIndex.toString()
    });
  })
);

// GET /api/event/participants - full participant list
router.get(
  "/participants",
  asyncHandler(async (req, res) => {
    const draw = getReadDraw();
    const count = Number(await draw.participantCount());
    const participants = await Promise.all(
      Array.from({ length: count }, (_, i) => draw.participants(i))
    );
    res.json({ participants });
  })
);

// GET /api/event/participants/:address - eligibility check
router.get(
  "/participants/:address",
  asyncHandler(async (req, res) => {
    const draw = getReadDraw();
    const isParticipant = await draw.isParticipant(req.params.address);
    res.json({ address: req.params.address, isParticipant });
  })
);

// POST /api/event/fund { amount, as: "sponsor" }
router.post(
  "/fund",
  asyncHandler(async (req, res) => {
    const { amount, as = "sponsor" } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required" });

    const parsedAmount = ethers.parseUnits(String(amount), 18);
    const token = getTokenAs(as);
    const draw = getDrawAs(as);
    const drawAddress = await draw.getAddress();

    const approveTx = await token.approve(drawAddress, parsedAmount);
    await approveTx.wait();

    const fundTx = await draw.fundDraw(parsedAmount);
    const receipt = await fundTx.wait();

    res.json({ txHash: receipt.hash });
  })
);

// POST /api/event/mint { as: "participantA" }
router.post(
  "/mint",
  asyncHandler(async (req, res) => {
    const { as } = req.body;
    if (!as) return res.status(400).json({ error: "as (signer role) is required" });

    const draw = getDrawAs(as);
    const tx = await draw.mintTicket();
    const receipt = await tx.wait();

    res.json({ txHash: receipt.hash });
  })
);

// POST /api/event/execute { as }
router.post(
  "/execute",
  asyncHandler(async (req, res) => {
    const { as = "sponsor" } = req.body;
    const draw = getDrawAs(as);
    const tx = await draw.executeDraw();
    const receipt = await tx.wait();

    res.json({ txHash: receipt.hash });
  })
);

// POST /api/event/claim { as }
router.post(
  "/claim",
  asyncHandler(async (req, res) => {
    const { as } = req.body;
    if (!as) return res.status(400).json({ error: "as (signer role) is required" });

    const draw = getDrawAs(as);
    const tx = await draw.claimPrize();
    const receipt = await tx.wait();

    res.json({ txHash: receipt.hash });
  })
);

module.exports = router;
