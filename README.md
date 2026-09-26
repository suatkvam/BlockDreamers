# MonadDraw frontend

The frontend follows the four screens in MonadDraw.pdf, retaining the requested muted purple-to-blue diagonal palette.

## Pages

- `/`: introduction, featured draw, community event, totals and how it works.
- `/login`: login / create-account forms and wallet connection entry point.
- `/events`: nine event cards with All / Open / Closed / Drawn / Settled / Cancelled filters.
- `/events/:id`: independent event data, ticket minting, selection, claim, transparency and participant list.

## Run and build

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Node 24 recommended. Build output: `dist`. The existing Vercel SPA rewrite supports direct navigation and refreshing all routes. No publication has been performed.

## Review flow

Open All draws, choose Builder Grant Draw, connect Sam Rivera, and mint a ticket. The count updates on both detail and list pages. Duplicate mint is disabled.

To review selection without waiting hours, open the already-closed Community Playtest Draw. Connect Jordan Lee, execute selection, then claim 120 DPRZ. Check the updated list status and home totals. Each event has independent state. Reload resets fixtures.

## Integration status

All accounts, event states and authentication responses are in-memory frontend fixtures. No wallet connection, authentication server, blockchain transaction or external network write is performed. Password inputs are discarded and never persisted. This is not production authentication. Replace the marked adapters before using real accounts.

See INTEGRATION.md for backend and contract handoff details.

## Scope

Testnet/local technical demonstration. No real funds or assets are transferred, tickets are not sold, and no operator profit is implemented. The PDF adds multiple-event navigation and authentication UI beyond the original MD's single-event frontend. Actual backend authentication and contract integration remain separate work.
