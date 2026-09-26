# MonadDraw

Trustless, EVM-compatible prize distribution engine. Sponsor funds a prize, participants mint NFT tickets, one participant gets selected after close, winner claims on-chain. Built for Monad testnet / local EVM demo.

## Scope and Disclaimer

MonadDraw is a hackathon testnet demonstration of a transparent prize distribution engine.

- No real funds are accepted.
- No real-world assets are transferred.
- Tickets are not sold.
- There is no paid entry.
- There is no operator profit mechanism.
- The demo uses test tokens and local/testnet environments only.

This project is intended as a technical protocol demonstration, not a live production service.

## Structure

- `contracts/` — `PrizeDraw.sol` (event, ticket mint, selection, claim), `PrizeToken.sol` (demo ERC20 prize token)
- `scripts/` — `deploy-demo.js` (local Hardhat/Anvil), `deploy-testnet.js` (Monad testnet)
- `server/` — Express API (`app.js`/`index.js`), routes in `server/routes`, contract ABIs in `server/abi`
- `src/` — React + Vite frontend (`App.tsx`, `services/`, `config/`)
- `test/`, `test-api/` — contract tests (Hardhat) and API integration tests (Mocha)

## Setup

```sh
npm install
cp .env.example .env   # fill in RPC_URL, PRIVATE_KEY, demo signer keys as needed
```

Env vars (`.env`):

| Var | Purpose |
|---|---|
| `RPC_URL` | Local EVM RPC (Hardhat/Anvil only) |
| `PRIVATE_KEY` | Deployer key, local test account only |
| `PORT` | API server port (default 3001) |
| `PRIZE_TOKEN_ADDRESS` / `PRIZE_DRAW_ADDRESS` | Deployed contract addresses |
| `SPONSOR_PRIVATE_KEY`, `PARTICIPANT_A_PRIVATE_KEY`, `PARTICIPANT_B_PRIVATE_KEY` | Demo role signers, local test accounts only |
| `MONAD_TESTNET_RPC_URL` | Optional, for testnet deployment |

Never put mainnet keys in these files.

## Run

Local chain + contracts:

```sh
npm run node               # local Hardhat node
npm run compile
npm run deploy:demo        # deploy PrizeToken + PrizeDraw to localhost
npm run deploy:testnet     # deploy to Monad testnet (needs MONAD_TESTNET_RPC_URL + PRIVATE_KEY)
```

API server:

```sh
npm start       # server/index.js
npm run dev:api # with nodemon
```

Frontend:

```sh
npm run dev       # vite dev server
npm run build     # tsc -b && vite build, output: dist
npm run preview
```

## Tests

```sh
npm test                # hardhat contract tests
npm run test:api        # mocha API integration tests
npm run test:frontend   # frontend service unit tests
npm run test:chain-local
npm run test:all        # all of the above
```

## Demo flow

1. Sponsor deploys a prize event and funds it with a demo ERC20 token (`deploy-demo.js` seeds this on localhost).
2. Participants mint NFT tickets via the frontend or API.
3. Participation window closes.
4. Selection is executed (demo-grade, clearly labeled — not production randomness).
5. Winner claims the prize on-chain.
6. All state is inspectable via the frontend transparency view and on-chain.

See `INTEGRATION.md` for backend/contract handoff details and `MonaDraw.md` for the full build spec, guardrails, and acceptance criteria.

## Guardrails

No paid tickets, no entry fees, no operator profit, no mainnet deployment, no real-world asset custody. If any change introduces one of these, remove it before merging.
