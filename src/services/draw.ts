/** INTEGRATION: This in-memory adapter supplies frontend example state only.
 * Replace its implementation with RPC reads and wallet-signed writes; keep UI types.
 * Never treat the selected account or these validations as authorization on-chain.
 * No keys, wallet requests, real transactions or fabricated explorer links are used.
 */
export type Status =
  "NotOpen" | "Open" | "Closed" | "Drawn" | "Settled" | "Cancelled";
export type Account = { name: string; address: string; role: string };
export const accounts: Account[] = [
  {
    name: "Alex Morgan",
    address: "0x91aF24eEb962598532ae64cF398d1fEfd148c729",
    role: "Sponsor",
  },
  {
    name: "Jordan Lee",
    address: "0x62Bc381Dd985197813ab96Fb546d2EeFc237d841",
    role: "Participant",
  },
  {
    name: "Sam Rivera",
    address: "0x83Cd492Ee196208924bc07Ac657e3FfAd348e952",
    role: "Participant",
  },
];
export const DRAW_ADDRESS = "0x47Ac293Bb074086702fa85Eb435c1DdEb126c730";
export const TOKEN_ADDRESS = "0x58Bd304Cc185197813ab96Fc546d2EeFc237d841";
export type Activity = {
  id: number;
  title: string;
  detail: string;
  time: number;
};
export type DrawState = {
  prize: number;
  funded: number;
  cap: number;
  closeAt: number;
  participants: string[];
  winner: string | null;
  seed: string | null;
  selectedIndex: number | null;
  drawn: boolean;
  settled: boolean;
  cancelled: boolean;
  approved: boolean;
  activity: Activity[];
};
export const initialState = (): DrawState => ({
  prize: 100,
  funded: 0,
  cap: 10,
  closeAt: 0,
  participants: [],
  winner: null,
  seed: null,
  selectedIndex: null,
  drawn: false,
  settled: false,
  cancelled: false,
  approved: false,
  activity: [],
});
export function statusOf(s: DrawState, now = Date.now()): Status {
  if (s.cancelled) return "Cancelled";
  if (s.settled) return "Settled";
  if (s.drawn) return "Drawn";
  if (!s.closeAt) return "NotOpen";
  if (now >= s.closeAt) return "Closed";
  return s.funded >= s.prize ? "Open" : "NotOpen";
}
export type Action =
  "approve" | "fund" | "mint" | "draw" | "claim" | "cancel" | "refund";
// INTEGRATION: map actions to approve(drawAddress, amount), fundDraw(amount),
// mintTicket(), executeDraw(), claimPrize(), sponsorCancelDraw(), sponsorForfeitPrize().
// Await receipt before refreshing all reads. Amounts become parseUnits(value, 18).
export function transition(
  s: DrawState,
  action: Action,
  account: string,
  amount = 100,
  now = Date.now(),
): DrawState {
  const next: DrawState = {
    ...s,
    participants: [...s.participants],
    activity: [...s.activity],
  };
  const status = statusOf(s, now);
  const sponsor = account.toLowerCase() === accounts[0].address.toLowerCase();
  let title = "";
  let detail = "";
  if (!accounts.some((a) => a.address === account))
    throw Error("Connect an account to continue.");
  if (s.cancelled || s.settled) throw Error("This event is complete.");
  if (["approve", "fund", "cancel", "refund"].includes(action) && !sponsor)
    throw Error("Only the sponsor can perform this action.");
  switch (action) {
    case "approve":
      if (status !== "NotOpen") throw Error("Funding is no longer available.");
      next.approved = true;
      title = "Token allowance approved";
      detail = "DPRZ is ready to fund this event.";
      break;
    case "fund":
      if (status !== "NotOpen" || !s.approved)
        throw Error("Approve the token allowance before funding.");
      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > s.prize - s.funded
      )
        throw Error("Enter an amount within the remaining prize balance.");
      next.funded += amount;
      // INTEGRATION: closeAt/openAt MUST be read from the deployed contract. The
      // reference contract starts its clock at deployment, not at funding. This
      // fixture starts a 60s participation window once fully funded for UI review.
      if (next.funded === s.prize) next.closeAt = now + 60_000;
      title = "Prize funded";
      detail = `${amount} DPRZ added to the prize pool.`;
      break;
    case "mint":
      if (status !== "Open") throw Error("Participation is not open.");
      if (s.participants.includes(account))
        throw Error("You already hold a participation ticket.");
      if (s.participants.length >= s.cap)
        throw Error("All participation tickets have been minted.");
      next.participants.push(account);
      title = "Participation confirmed";
      detail = `Ticket #${String(next.participants.length - 1).padStart(3, "0")} minted.`;
      break;
    case "draw":
      if (status !== "Closed" || !s.participants.length || s.funded < s.prize)
        throw Error(
          "Selection requires a closed, funded event with participants.",
        );
      // INTEGRATION: remove local selection. Read drawSeed, selectedIndex and winner
      // from the mined contract transaction. First entrant is selected consistently
      // here to make the entire frontend review reproducible.
      next.seed = "0x" + "0".repeat(63) + "0";
      next.selectedIndex = 0;
      next.winner = s.participants[0];
      next.drawn = true;
      title = "Selection complete";
      detail = "The selected participant can now claim the prize.";
      break;
    case "claim":
      if (status !== "Drawn" || account !== s.winner)
        throw Error("Only the selected participant can claim.");
      next.settled = true;
      title = "Prize claimed";
      detail = `${s.prize} DPRZ transferred to the selected participant.`;
      break;
    case "cancel":
      if (s.participants.length || status === "Closed" || status === "Drawn")
        throw Error(
          "Cancellation is available only before close with no participants.",
        );
      next.cancelled = true;
      next.funded = 0;
      title = "Event cancelled";
      detail = "Funded tokens returned to the sponsor.";
      break;
    case "refund":
      if (status !== "Closed" || s.participants.length)
        throw Error("A refund requires a closed event with no participants.");
      next.cancelled = true;
      next.funded = 0;
      title = "Prize returned";
      detail = "Funded tokens returned to the sponsor.";
      break;
  }
  next.activity.unshift({ id: now, title, detail, time: now });
  return next;
}
export interface DrawGateway {
  read(): Promise<DrawState>;
  execute(action: Action, account: string, amount?: number): Promise<DrawState>;
}
let state = initialState();
export const drawGateway: DrawGateway = {
  async read() {
    return state;
  },
  async execute(action, account, amount) {
    await new Promise((r) => setTimeout(r, 900));
    state = transition(state, action, account, amount);
    return state;
  },
};
// INTEGRATION: replace account picker with provider connection and listen for
// accountsChanged / chainChanged / disconnect. Validate chain before writes.
// Reads: sponsor, prizeAmount, fundedAmount, ticketCap, openAt, closeAt, status,
// participantCount, participants(i), isParticipant, participantTicketId, winner,
// drawSeed, selectedIndex, token symbol/decimals/balanceOf/allowance.
