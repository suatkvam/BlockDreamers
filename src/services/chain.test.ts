import { test } from "node:test";
import assert from "node:assert/strict";
import { formatUnits, parseUnits } from "ethers";
import { normalizeError, statusLabel } from "./chain.ts";
import { hasInjectedWallet, MONAD_TESTNET_PARAMS } from "./wallet.ts";

test("statusLabel maps the contract's Status enum order", () => {
  assert.equal(statusLabel(0), "NotOpen");
  assert.equal(statusLabel(1), "Open");
  assert.equal(statusLabel(2), "Closed");
  assert.equal(statusLabel(3), "Drawn");
  assert.equal(statusLabel(4), "Settled");
  assert.equal(statusLabel(5), "Cancelled");
});

test("normalizeError maps known custom errors to the transition()-style messages", () => {
  assert.match(
    normalizeError({ revert: { name: "NotSponsor" } }).message,
    /Only the sponsor/,
  );
  assert.match(
    normalizeError({ revert: { name: "AlreadyParticipant" } }).message,
    /already hold/,
  );
  assert.match(
    normalizeError({ revert: { name: "TicketCapReached" } }).message,
    /All participation tickets/,
  );
  assert.match(
    normalizeError({ revert: { name: "NotWinner" } }).message,
    /Only the selected participant/,
  );
});

test("normalizeError falls back to a message extracted from a raw RPC error string", () => {
  const err = {
    info: {
      error: {
        message:
          "Error: VM Exception while processing transaction: reverted with custom error 'DrawNotOpen()'",
      },
    },
  };
  assert.match(normalizeError(err).message, /Participation is not open/);
});

test("normalizeError recognizes a rejected wallet signature", () => {
  const err = { shortMessage: "user rejected action" };
  assert.match(normalizeError(err).message, /rejected/);
});

test("normalizeError has a generic fallback for unrecognized errors", () => {
  assert.equal(
    normalizeError(new Error("boom")).message,
    "The operation failed. Please try again.",
  );
});

test("wei/display amount round-trips through parseUnits/formatUnits", () => {
  assert.equal(Number(formatUnits(parseUnits("120", 18), 18)), 120);
  assert.equal(Number(formatUnits(parseUnits("500", 18), 18)), 500);
});

test("Monad Testnet chain id is 0x279f (10143 decimal)", () => {
  assert.equal(MONAD_TESTNET_PARAMS.chainId, "0x279f");
  assert.equal(parseInt(MONAD_TESTNET_PARAMS.chainId, 16), 10143);
});

test("hasInjectedWallet is false outside a browser, so the live gate always falls back to fixtures in CI", () => {
  assert.equal(hasInjectedWallet(), false);
});
