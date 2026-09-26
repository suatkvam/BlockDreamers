# MonadDraw

Trustless testnet demo: sponsor funds prize, participants mint NFT tickets, one participant gets selected, winner claims prize on-chain.

## Scope and Disclaimer

MonadDraw is a hackathon testnet demonstration of a transparent prize distribution engine.

- No real funds are accepted.
- No real-world assets are transferred.
- Tickets are not sold.
- There is no paid entry.
- There is no operator profit mechanism.
- The demo uses test tokens and local/testnet environments only.

This project is intended as a technical protocol demonstration, not a live production service.

## Stack

- Contracts: `contracts/PrizeDraw.sol`, `contracts/PrizeToken.sol` (Hardhat, Solidity 0.8.24)
- API: `server/` (Express)
- Frontend: `src/` (React + Vite + Tailwind)

## Setup

```sh
npm install
cp .env.example .env   # PRIVATE_KEY, RPC_URL, MONAD_TESTNET_RPC_URL as needed
```

## Contracts

```sh
npm run compile
npm test                    # hardhat test
npm run node                # local Anvil-equivalent EVM (Hardhat node)
npm run deploy:demo         # deploy PrizeToken + PrizeDraw to localhost, writes deployment.json
npm run deploy:testnet      # deploy to monadTestnet (requires PRIVATE_KEY + MONAD_TESTNET_RPC_URL)
```

## API + Frontend

```sh
npm run dev:api             # server/index.js on PORT (default 3001)
npm run dev                 # vite dev server
npm run build && npm run preview
```

## Tests

```sh
npm run test            # contracts (hardhat)
npm run test:api        # API integration tests
npm run test:frontend   # frontend unit tests
npm run test:chain-local
npm run test:all         # everything above
```

## Demo flow

1. Run `npm run node` (local chain), then `npm run deploy:demo` — sponsor funds the prize with a demo ERC20 token.
2. Start API (`npm run dev:api`) and frontend (`npm run dev`).
3. Open `/events`, pick an open draw, connect a wallet, mint a participation ticket.
4. After the participation window closes, execute selection on the closed draw.
5. Winner claims the prize; transparency data (participants, selection, claim) is visible in the event detail view.

## UI copy rules

Use: participation ticket, prize event, participant selection, sponsor-funded prize, transparent selection, testnet demo.
Avoid: buy ticket, pay to enter, raffle, lottery, odds, chance to win, organizer profit, ticket sale.

## Docs

- `MonaDraw.md` — canonical build spec, source of truth for scope/acceptance criteria.
- `INTEGRATION.md` — backend/contract handoff details for the frontend.

Node 24 recommended (`--experimental-strip-types` used by test scripts).
