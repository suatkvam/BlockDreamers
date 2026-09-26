/** Provider/signer-injectable read/write wrapper around the deployed PrizeDraw
 * and PrizeToken contracts. Reads take a Provider, writes take a Signer, so
 * this module works identically against a real MetaMask BrowserProvider or a
 * plain ethers.Wallet in a local test — no MetaMask-specific code lives here.
 */
import {
  Contract,
  formatUnits,
  parseUnits,
  ZeroAddress,
  ZeroHash,
  type Provider,
  type Signer,
} from "ethers";
import type { Status } from "./draw.ts";

export const PRIZE_DRAW_ABI = [
  "function status() view returns (uint8)",
  "function sponsor() view returns (address)",
  "function prizeToken() view returns (address)",
  "function prizeAmount() view returns (uint256)",
  "function fundedAmount() view returns (uint256)",
  "function ticketCap() view returns (uint256)",
  "function openAt() view returns (uint64)",
  "function closeAt() view returns (uint64)",
  "function participantCount() view returns (uint256)",
  "function participants(uint256) view returns (address)",
  "function isParticipant(address) view returns (bool)",
  "function participantTicketId(address) view returns (uint256)",
  "function winner() view returns (address)",
  "function drawSeed() view returns (bytes32)",
  "function selectedIndex() view returns (uint256)",
  "function fundDraw(uint256 amount)",
  "function mintTicket()",
  "function executeDraw()",
  "function claimPrize()",
  "function sponsorCancelDraw()",
  "function sponsorForfeitPrize()",
  "error NotSponsor()",
  "error DrawNotOpen()",
  "error DrawNotClosed()",
  "error DrawNotDrawn()",
  "error AlreadyParticipant()",
  "error TicketCapReached()",
  "error NoParticipants()",
  "error NotWinner()",
  "error FundingExceedsPrize()",
  "error CannotCancelAfterParticipants()",
  "error DrawAlreadyCancelled()",
  "error InvalidDuration()",
  "error InvalidCap()",
  "error InvalidToken()",
  "error InvalidAmount()",
];

export const PRIZE_TOKEN_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
];

const STATUS_LABELS: Status[] = [
  "NotOpen",
  "Open",
  "Closed",
  "Drawn",
  "Settled",
  "Cancelled",
];

export function statusLabel(code: number): Status {
  return STATUS_LABELS[code];
}

export function drawContract(address: string, runner: Provider | Signer) {
  return new Contract(address, PRIZE_DRAW_ABI, runner);
}

export function tokenContract(address: string, runner: Provider | Signer) {
  return new Contract(address, PRIZE_TOKEN_ABI, runner);
}

// Same message substrings transition() in draw.ts already throws, so the
// UI's existing error-toast rendering needs no changes for the live path.
const ERROR_MESSAGES: Record<string, string> = {
  NotSponsor: "Only the sponsor can perform this action.",
  DrawNotOpen: "Participation is not open.",
  DrawNotClosed: "Funding is no longer available.",
  DrawNotDrawn: "Only the selected participant can claim.",
  AlreadyParticipant: "You already hold a participation ticket.",
  TicketCapReached: "All participation tickets have been minted.",
  NoParticipants:
    "Selection requires a closed, funded event with participants.",
  NotWinner: "Only the selected participant can claim.",
  FundingExceedsPrize: "Enter an amount within the remaining prize balance.",
  CannotCancelAfterParticipants:
    "Cancellation is available only before close with no participants.",
  DrawAlreadyCancelled: "This event is complete.",
};

function extractErrorName(err: unknown): string | undefined {
  const e = err as {
    revert?: { name?: string };
    errorName?: string;
    info?: { error?: { message?: string } };
    shortMessage?: string;
    message?: string;
  };
  if (e?.revert?.name) return e.revert.name;
  if (e?.errorName) return e.errorName;
  const haystacks = [
    e?.info?.error?.message,
    e?.shortMessage,
    e?.message,
  ].filter(Boolean) as string[];
  for (const text of haystacks) {
    const match = text.match(/custom error '?(\w+)\(?\)?'?/);
    if (match) return match[1];
  }
  return undefined;
}

export function normalizeError(err: unknown): Error {
  const name = extractErrorName(err);
  if (name && ERROR_MESSAGES[name]) return new Error(ERROR_MESSAGES[name]);
  const message =
    (err as { shortMessage?: string; reason?: string; message?: string })
      ?.shortMessage ??
    (err as { reason?: string })?.reason ??
    (err as Error)?.message ??
    "";
  if (/user rejected/i.test(message)) {
    return new Error("Transaction was rejected.");
  }
  return new Error("The operation failed. Please try again.");
}

// ethers v6 briefly caches an identical getTransactionCount("pending") call
// (a few hundred ms) to dedupe concurrent requests. On an automining chain
// (Hardhat/Anvil, and possibly a fast testnet), two writes from the same
// signer fired back-to-back can hit that cache and reuse a just-mined nonce.
// A short pause after each mined receipt lets that cache entry expire before
// the next write populates its transaction.
const NONCE_CACHE_SETTLE_MS = 300;

async function withNormalizedErrors<T>(
  _signer: Signer,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn();
    await new Promise((resolve) => setTimeout(resolve, NONCE_CACHE_SETTLE_MS));
    return result;
  } catch (err) {
    throw normalizeError(err);
  }
}

export type DrawSnapshot = {
  status: Status;
  sponsor: string;
  decimals: number;
  symbol: string;
  prize: number;
  funded: number;
  cap: number;
  openAt: number;
  closeAt: number;
  participants: string[];
  winner: string | null;
  seed: string | null;
  selectedIndex: number | null;
};

// Monad Testnet's public RPC enforces a strict, sometimes bursty per-second
// call budget (tighter in practice than its documented 25 rps for eth_call),
// and a single snapshot read is ~13 calls. Run them one at a time with a
// small gap, and retry with backoff on a rate-limit response, instead of one
// big Promise.all -- otherwise three live cards polling at once trip
// "requests limited to N/sec".
const RPC_CALL_DELAY_MS = 80;
const RATE_LIMIT_RETRIES = 4;
const RATE_LIMIT_BACKOFF_MS = 400;

function isRateLimitError(err: unknown): boolean {
  const message =
    (err as { info?: { error?: { message?: string } }; shortMessage?: string })
      ?.info?.error?.message ??
    (err as { shortMessage?: string })?.shortMessage ??
    "";
  return /limited to \d+\/sec|rate limit/i.test(message);
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= RATE_LIMIT_RETRIES || !isRateLimitError(err)) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_BACKOFF_MS * (attempt + 1)),
      );
    }
  }
}

async function chunkedAll<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < fns.length; i++) {
    results.push(await callWithRetry(fns[i]));
    if (i < fns.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, RPC_CALL_DELAY_MS));
    }
  }
  return results;
}

export async function readDrawSnapshot(
  drawAddress: string,
  tokenAddress: string,
  provider: Provider,
): Promise<DrawSnapshot> {
  const draw = drawContract(drawAddress, provider);
  const token = tokenContract(tokenAddress, provider);
  const [
    statusCode,
    sponsor,
    prizeAmount,
    fundedAmount,
    ticketCap,
    openAt,
    closeAt,
    participantCount,
    winner,
    drawSeed,
    selectedIndex,
    decimals,
    symbol,
  ] = await chunkedAll([
    () => draw.status(),
    () => draw.sponsor(),
    () => draw.prizeAmount(),
    () => draw.fundedAmount(),
    () => draw.ticketCap(),
    () => draw.openAt(),
    () => draw.closeAt(),
    () => draw.participantCount(),
    () => draw.winner(),
    () => draw.drawSeed(),
    () => draw.selectedIndex(),
    () => token.decimals(),
    () => token.symbol(),
  ]);
  const count = Number(participantCount);
  const participants: string[] = await chunkedAll(
    Array.from({ length: count }, (_, i) => () => draw.participants(i)),
  );
  const isDrawn = winner !== ZeroAddress;
  return {
    status: statusLabel(Number(statusCode)),
    sponsor,
    decimals: Number(decimals),
    symbol,
    prize: Number(formatUnits(prizeAmount, decimals)),
    funded: Number(formatUnits(fundedAmount, decimals)),
    cap: Number(ticketCap),
    openAt: Number(openAt) * 1000,
    closeAt: Number(closeAt) * 1000,
    participants,
    winner: isDrawn ? winner : null,
    seed: drawSeed === ZeroHash ? null : drawSeed,
    selectedIndex: isDrawn ? Number(selectedIndex) : null,
  };
}

export async function readIsParticipant(
  drawAddress: string,
  provider: Provider,
  account: string,
): Promise<boolean> {
  return drawContract(drawAddress, provider).isParticipant(account);
}

export async function readTokenBalance(
  tokenAddress: string,
  provider: Provider,
  account: string,
): Promise<number> {
  const token = tokenContract(tokenAddress, provider);
  const [balance, decimals] = await Promise.all([
    token.balanceOf(account),
    token.decimals(),
  ]);
  return Number(formatUnits(balance, decimals));
}

export async function readAllowance(
  tokenAddress: string,
  provider: Provider,
  owner: string,
  spender: string,
): Promise<number> {
  const token = tokenContract(tokenAddress, provider);
  const [allowance, decimals] = await Promise.all([
    token.allowance(owner, spender),
    token.decimals(),
  ]);
  return Number(formatUnits(allowance, decimals));
}

export async function approve(
  tokenAddress: string,
  drawAddress: string,
  amount: number,
  decimals: number,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await tokenContract(tokenAddress, signer).approve(
      drawAddress,
      parseUnits(String(amount), decimals),
    );
    await tx.wait();
  });
}

export async function fundDraw(
  drawAddress: string,
  amount: number,
  decimals: number,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await drawContract(drawAddress, signer).fundDraw(
      parseUnits(String(amount), decimals),
    );
    await tx.wait();
  });
}

export async function mintTicket(
  drawAddress: string,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await drawContract(drawAddress, signer).mintTicket();
    await tx.wait();
  });
}

export async function executeDraw(
  drawAddress: string,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await drawContract(drawAddress, signer).executeDraw();
    await tx.wait();
  });
}

export async function claimPrize(
  drawAddress: string,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await drawContract(drawAddress, signer).claimPrize();
    await tx.wait();
  });
}

export async function sponsorCancelDraw(
  drawAddress: string,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await drawContract(drawAddress, signer).sponsorCancelDraw();
    await tx.wait();
  });
}

export async function sponsorForfeitPrize(
  drawAddress: string,
  signer: Signer,
): Promise<void> {
  await withNormalizedErrors(signer, async () => {
    const tx = await drawContract(drawAddress, signer).sponsorForfeitPrize();
    await tx.wait();
  });
}
