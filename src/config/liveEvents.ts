/** Public registry of live Monad Testnet deployments, keyed by event id.
 * Committable: addresses only, never secrets. Ships empty so a fresh clone
 * builds/runs/tests fine with all 9 events on the fixture path. Overwritten
 * wholesale by `npm run deploy:testnet` (scripts/deploy-testnet.js) once the
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

export const liveEvents: Partial<Record<LiveEventId, LiveEventEntry>> = {};
