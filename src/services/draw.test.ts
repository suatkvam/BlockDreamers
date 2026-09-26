import { test } from "node:test";
import assert from "node:assert/strict";
import { accounts, initialState, statusOf, transition } from "./draw.ts";
const sponsor = accounts[0].address,
  participant = accounts[1].address,
  other = accounts[2].address;
function funded() {
  return transition(
    transition(initialState(), "approve", sponsor, 100, 1000),
    "fund",
    sponsor,
    100,
    2000,
  );
}
test("full lifecycle: funding, unique tickets, time-gated selection, winner-only claim", () => {
  let s = funded();
  assert.equal(statusOf(s, 3000), "Open");
  s = transition(s, "mint", participant, 100, 3000);
  assert.throws(() => transition(s, "mint", participant, 100, 4000), /already/);
  assert.throws(() => transition(s, "draw", participant, 100, 5000), /closed/);
  s = transition(s, "draw", other, 100, 63000);
  assert.equal(s.winner, participant);
  assert.equal(s.participants[s.selectedIndex!], s.winner);
  assert.equal(
    Number(BigInt(s.seed!) % BigInt(s.participants.length)),
    s.selectedIndex,
  );
  assert.throws(() => transition(s, "claim", other, 100, 64000), /Only/);
  s = transition(s, "claim", participant, 100, 65000);
  assert.equal(statusOf(s, 66000), "Settled");
  assert.throws(
    () => transition(s, "claim", participant, 100, 67000),
    /complete/,
  );
});
test("funding permissions, approval and amount validation", () => {
  let s = initialState();
  assert.throws(() => transition(s, "approve", participant), /sponsor/);
  assert.throws(() => transition(s, "fund", sponsor), /Approve/);
  s = transition(s, "approve", sponsor);
  assert.throws(() => transition(s, "fund", sponsor, 101), /amount/);
  assert.throws(() => transition(s, "fund", sponsor, NaN), /amount/);
  s = transition(s, "fund", sponsor, 40);
  assert.equal(statusOf(s), "NotOpen");
  s = transition(s, "fund", sponsor, 60);
  assert.equal(statusOf(s), "Open");
});
test("ticket cap, close, empty event refund, cancellation", () => {
  let s = { ...funded(), cap: 1 };
  s = transition(s, "mint", participant, 100, 3000);
  assert.throws(() => transition(s, "mint", other, 100, 4000), /All/);
  assert.throws(
    () => transition(s, "cancel", sponsor, 100, 5000),
    /Cancellation/,
  );
  assert.throws(() => transition(s, "mint", other, 100, 63000), /not open/);
  const empty = funded();
  assert.throws(
    () => transition(empty, "draw", sponsor, 100, 63000),
    /participants/,
  );
  const refunded = transition(empty, "refund", sponsor, 100, 63000);
  assert.equal(refunded.funded, 0);
  assert.equal(statusOf(refunded), "Cancelled");
  assert.equal(
    statusOf(transition(funded(), "cancel", sponsor, 100, 3000)),
    "Cancelled",
  );
});
