# Frontend integration map

## Current boundary

`src/services/draw.ts` contains all example state, account fixtures, state transitions, and the `DrawGateway` interface. Replace `drawGateway` with a real implementation. `src/App.tsx` consumes this interface; it does not perform network calls. No private key is required or included.

| UI             | Read                                                        | Write / result                                                               |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Account dialog | Wallet account, chain ID                                    | provider connect; handle account/network changes and disconnect              |
| Prize/event    | prizeAmount, fundedAmount, ticketCap, status, closeAt       | Poll every 3–5s and refresh after receipt                                    |
| Sponsor        | sponsor, allowance, token balance                           | approve(drawAddress, amount), await receipt, fundDraw(amount), await receipt |
| Participation  | isParticipant(address), participantTicketId(address), count | mintTicket(), wait receipt, refresh ticket/count/list                        |
| Selection      | status, count, funded amount                                | executeDraw(), wait receipt, read winner/drawSeed/selectedIndex              |
| Claim          | winner, status, token balance                               | claimPrize(), wait receipt, refresh status/balance                           |
| Cancel/refund  | sponsor, status, participantCount                           | sponsorCancelDraw() / sponsorForfeitPrize()                                  |
| Transparency   | addresses, ordered participants(i), seed/index/winner       | Copy real addresses; explorer links only for actual transaction hashes       |
| Activity       | Contract event logs                                         | PrizeFunded, TicketMinted, DrawExecuted, PrizeClaimed, DrawCancelled         |

## Required deployment inputs

RPC URL, chain ID, explorer base URL, deployed PrizeDraw and PrizeToken addresses, and compiled ABIs. Suggested frontend variables: VITE_RPC_URL, VITE_CHAIN_ID, VITE_DRAW_ADDRESS, VITE_PRIZE_TOKEN_ADDRESS, VITE_EXPLORER_URL. These values are public. Never put private keys in VITE variables.

Use Ethers v6 (or the team's wallet stack) in the real adapter. Public reads should work without connecting a wallet. Request a signer only for writes. A wallet connection is not authentication for a backend.

## Data and behavior requirements

- Current `number` token values are fixtures only. Real uint256 values use bigint, parseUnits and formatUnits; never convert a token balance to Number.
- Status values: 0 NotOpen, 1 Open, 2 Closed, 3 Drawn, 4 Settled, 5 Cancelled. Real status is authoritative from the contract; the client timer is display-only.
- The reference contract starts its timer at deployment. The fixture starts 60 seconds after full funding solely to make frontend review convenient. Replace with on-chain openAt/closeAt; do not copy fixture timing into the contract.
- Current seed is zero and selected index is zero, consistent with seed modulo participant count. Remove all local winner calculations; consume the real contract result.
- Ticket #000 is valid. Never use a truthiness check on ticket ID or selectedIndex. Use isParticipant and nullable selection data.
- The provided specification's ABI subset omits sponsor, openAt, participantTicketId and participants. Export complete ABIs from the compiled contracts.
- Replace the hardcoded 100 DPRZ display strings, name/symbol, network label and account names with actual state/configuration when supporting other events. MVP currently targets one 100 DPRZ event.
- Account comparisons should use normalized addresses. Replace account fixture membership checks with the wallet's current account; contract permissions remain authoritative.
- Handle wallet rejection, wrong chain, missing provider, insufficient gas, RPC failure, contract custom errors and reverted receipts. Do not mark success until receipt confirmation.
- Prevent duplicate requests. Abort or ignore stale reads after account/network changes; refetch after transactions.
- Account dialog is a fixture account selector, not a real wallet provider. Remove it when implementing the selected wallet library.
- Activity currently has no transaction hashes; do not invent hashes. Populate hash and explorer links from receipts/logs later.

## Frontend acceptance checked

TypeScript production build; state-machine tests for funding authorization, partial funding, duplicate mint, cap, close, selection, winner-only claim, repeat claim, cancellation and empty-event refund. Browser review covers account selection and visual/interaction flow.

## PDF design revision: routes and multiple events

The current UI follows the four reference screens from MonadDraw.pdf. The user's later PDF design takes precedence over the original MD's single-page layout. Routes: `/`, `/login`, `/events`, `/events/:id`.

`src/services/events.ts` is now the active event adapter. `eventGateway.list()` returns event metadata plus state; `eventGateway.execute(id, action, account, amount)` updates only that event. The old single-event gateway in draw.ts is not consumed by the UI; its pure transition rules are reused and tested.

Replace the registry fixtures with backend event metadata or an explicit deployed-contract registry. Contract addresses and participant lists must be real. Status filters, home totals, detail values and claim amounts derive from the same event state. Initial totals intentionally equal the actual nine fixtures rather than unrelated decorative totals in the PDF. Future event loading should include loading/error/empty state and pagination as needed.

Authentication: App.tsx submitAuth currently discards entered credentials and returns an in-memory success after a short delay. Replace with the backend login/register endpoints and secure session handling. Do not persist passwords, infer authentication from local UI state, or enable production signup before this integration. Wallet connection is independent of email authentication.

Fixtures: Jordan Lee is the first participant and selected account for existing draws. Sam Rivera has not participated, so use Sam to test a new mint. Community Playtest is already Closed for immediate selection/claim testing. Real timestamps, ticket order, recent activity timestamps and randomness must come from the contract/backend; recent participant rows currently show actual ticket indices instead of invented times.
