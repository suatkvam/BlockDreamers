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
    "prizeDrawAddress": "0x5Ef8339bEe60a39Cd78a15f8614341801a829D4A",
    "prizeTokenAddress": "0x28F67674Fe9097128cA4439976c7C588b6A75Ad5",
    "chainId": 10143
  },
  "docs-sprint": {
    "prizeDrawAddress": "0x42e17bf7DE88060c037c27fB68abD5e80f40b147",
    "prizeTokenAddress": "0x28F67674Fe9097128cA4439976c7C588b6A75Ad5",
    "chainId": 10143
  },
  "community-playtest": {
    "prizeDrawAddress": "0x27D8a8AcF12A653c39AaB996aD21F2e51bA0c68c",
    "prizeTokenAddress": "0x28F67674Fe9097128cA4439976c7C588b6A75Ad5",
    "chainId": 10143
  }
};
