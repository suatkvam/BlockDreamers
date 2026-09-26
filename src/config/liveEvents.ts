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

export const liveEvents: Partial<Record<LiveEventId, LiveEventEntry>> = {
  "builder-grant": {
    "prizeDrawAddress": "0x7833ffE44cF8BC949D6440eF366E1a91E17f70D0",
    "prizeTokenAddress": "0x3E9dDDffeDd24c3e8eB30261A02793b8ffB4A89C",
    "chainId": 10143
  },
  "docs-sprint": {
    "prizeDrawAddress": "0xA47f18EB95b6e5924330C76F37a11738B126Af15",
    "prizeTokenAddress": "0x3E9dDDffeDd24c3e8eB30261A02793b8ffB4A89C",
    "chainId": 10143
  },
  "community-playtest": {
    "prizeDrawAddress": "0xFa1aef0869D17570d7C74ad27e5E6Dba8cE23399",
    "prizeTokenAddress": "0x3E9dDDffeDd24c3e8eB30261A02793b8ffB4A89C",
    "chainId": 10143
  }
};
