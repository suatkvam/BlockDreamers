import { accounts, initialState, transition } from "./draw.ts";
import type { Action, Activity, DrawState, Status } from "./draw.ts";
import { LIVE_EVENT_IDS, liveEvents } from "../config/liveEvents.ts";
import type { LiveEventId } from "../config/liveEvents.ts";
import { hasInjectedWallet, getBrowserProvider } from "./wallet.ts";
import * as chain from "./chain.ts";

export type EventRecord = {
  id: string;
  name: string;
  address: string;
  state: DrawState;
  sponsorAddress?: string;
};
const definitions: [string, string, number, number, number, Status, number][] =
  [
    ["builder-grant", "Builder Grant Draw", 500, 128, 500, "Open", 15120],
    ["community-playtest", "Community Playtest Draw", 120, 64, 64, "Closed", 0],
    ["docs-sprint", "Docs Sprint Draw", 80, 19, 200, "Open", 97200],
    ["testnet-explorer", "Testnet Explorer Draw", 250, 300, 300, "Drawn", 0],
    ["bug-bounty", "Bug Bounty Draw", 60, 40, 40, "Settled", 0],
    ["onboarding", "Onboarding Draw", 30, 7, 50, "Open", 194400],
    ["feedback-loop", "Feedback Loop Draw", 40, 0, 100, "Cancelled", 0],
    ["contributor", "Contributor Draw", 150, 90, 90, "Settled", 0],
    ["hackathon", "Hackathon Demo Draw", 100, 45, 120, "Open", 24000],
  ];
// INTEGRATION: GET event registry/metadata from your backend or a deployed-address
// registry. Each ID maps to its own contract; never share state across events.
// Names and images are off-chain metadata. Balances/status/participants come from RPC.
const events: EventRecord[] = definitions.map(
  ([id, name, prize, count, cap, status, seconds], i) => {
    const participants = Array.from({ length: count }, (_, j) =>
      j === 0
        ? accounts[1].address
        : "0x" + ((i + 1) * 10000 + j).toString(16).padStart(40, "0"),
    );
    const drawn = status === "Drawn" || status === "Settled";
    return {
      id,
      name,
      address: "0x" + (90000 + i).toString(16).padStart(40, "0"),
      state: {
        ...initialState(),
        prize,
        cap,
        participants,
        funded: status === "Cancelled" ? 0 : prize,
        approved: true,
        closeAt: seconds ? Date.now() + seconds * 1000 : Date.now() - 60000,
        drawn,
        settled: status === "Settled",
        cancelled: status === "Cancelled",
        winner: drawn ? participants[0] : null,
        selectedIndex: drawn ? 0 : null,
        seed: drawn ? "0x" + "0".repeat(64) : null,
      },
    };
  },
);

// Live/fixture gate: only a designated live id, with a registry entry, in a
// real browser with an injected wallet, ever leaves the pure fixture path.
// Under plain Node (no `window`) this is always false, so events.test.ts's
// assertions against builder-grant/docs-sprint/community-playtest continue
// to exercise transition() exactly as before.
function isLive(id: string): id is LiveEventId {
  return (
    (LIVE_EVENT_IDS as readonly string[]).includes(id) &&
    !!liveEvents[id as LiveEventId] &&
    hasInjectedWallet()
  );
}

let activitySeq = 0;
function activity(title: string, detail: string): Activity {
  return { id: Date.now() * 1000 + activitySeq++, title, detail, time: Date.now() };
}

// The contract has no activity feed; synthesize the same shape transition()
// produces by diffing the previous rendered state against the fresh snapshot.
function toDrawState(
  prev: DrawState,
  snap: chain.DrawSnapshot,
  approved: boolean,
): DrawState {
  const next: DrawState = {
    ...prev,
    prize: snap.prize,
    funded: snap.funded,
    cap: snap.cap,
    closeAt: snap.closeAt,
    participants: snap.participants,
    winner: snap.winner,
    seed: snap.seed,
    selectedIndex: snap.selectedIndex,
    drawn: snap.status === "Drawn" || snap.status === "Settled",
    settled: snap.status === "Settled",
    cancelled: snap.status === "Cancelled",
    approved,
    activity: [...prev.activity],
  };
  if (snap.participants.length > prev.participants.length) {
    const idx = snap.participants.length - 1;
    next.activity.unshift(
      activity(
        "Participation confirmed",
        `Ticket #${String(idx).padStart(3, "0")} minted.`,
      ),
    );
  }
  if (snap.winner && !prev.winner) {
    next.activity.unshift(
      activity(
        "Selection complete",
        "The selected participant can now claim the prize.",
      ),
    );
  }
  if (snap.status === "Settled" && !prev.settled) {
    next.activity.unshift(
      activity(
        "Prize claimed",
        `${snap.prize} DPRZ transferred to the selected participant.`,
      ),
    );
  }
  if (snap.funded > prev.funded) {
    next.activity.unshift(
      activity("Prize funded", `${snap.funded - prev.funded} DPRZ added to the prize pool.`),
    );
  }
  if (snap.status === "Cancelled" && !prev.cancelled) {
    next.activity.unshift(activity("Event cancelled", "Funded tokens returned to the sponsor."));
  }
  return next;
}

async function readLive(event: EventRecord): Promise<EventRecord> {
  const entry = liveEvents[event.id as LiveEventId]!;
  const provider = getBrowserProvider();
  const snap = await chain.readDrawSnapshot(
    entry.prizeDrawAddress,
    entry.prizeTokenAddress,
    provider,
  );
  const approved =
    snap.status !== "NotOpen" ||
    (await chain.readAllowance(
      entry.prizeTokenAddress,
      provider,
      snap.sponsor,
      entry.prizeDrawAddress,
    )) >= snap.prize - snap.funded;
  return {
    ...event,
    address: entry.prizeDrawAddress,
    sponsorAddress: snap.sponsor,
    state: toDrawState(event.state, snap, approved),
  };
}

export const eventGateway = {
  async list() {
    return Promise.all(
      events.map((e) => (isLive(e.id) ? readLive(e) : Promise.resolve({ ...e }))),
    );
  },
  async execute(id: string, action: Action, account: string, amount?: number) {
    const event = events.find((e) => e.id === id);
    if (!event) throw Error("Event not found.");
    if (!isLive(id)) {
      await new Promise((r) => setTimeout(r, 650));
      event.state = transition(event.state, action, account, amount);
      return [...events];
    }
    const entry = liveEvents[id as LiveEventId]!;
    const signer = await getBrowserProvider().getSigner();
    const decimals = 18; // DPRZ is always deployed with 18 decimals in this demo
    switch (action) {
      case "approve":
        await chain.approve(entry.prizeTokenAddress, entry.prizeDrawAddress, amount ?? 0, decimals, signer);
        break;
      case "fund":
        await chain.fundDraw(entry.prizeDrawAddress, amount ?? 0, decimals, signer);
        break;
      case "mint":
        await chain.mintTicket(entry.prizeDrawAddress, signer);
        break;
      case "draw":
        await chain.executeDraw(entry.prizeDrawAddress, signer);
        break;
      case "claim":
        await chain.claimPrize(entry.prizeDrawAddress, signer);
        break;
      case "cancel":
        await chain.sponsorCancelDraw(entry.prizeDrawAddress, signer);
        break;
      case "refund":
        await chain.sponsorForfeitPrize(entry.prizeDrawAddress, signer);
        break;
    }
    return this.list();
  },
};
