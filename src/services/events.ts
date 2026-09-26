import { accounts, initialState, transition } from "./draw.ts";
import type { Action, DrawState, Status } from "./draw.ts";
export type EventRecord = {
  id: string;
  name: string;
  address: string;
  state: DrawState;
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
export const eventGateway = {
  async list() {
    return [...events];
  },
  async execute(id: string, action: Action, account: string, amount?: number) {
    await new Promise((r) => setTimeout(r, 650));
    const event = events.find((e) => e.id === id);
    if (!event) throw Error("Event not found.");
    event.state = transition(event.state, action, account, amount);
    return [...events];
  },
};

