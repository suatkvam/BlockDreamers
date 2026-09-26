# MonadDraw — Hackathon Project Specification

> **Canonical build document for AI agents and team members.**  
> Build the MVP exactly as specified below. If instructions conflict, use this priority order:  
> 1. Guardrails and non-goals  
> 2. MVP scope  
> 3. Acceptance criteria  
> 4. Future extensions  

---

## 0. Agent Execution Contract

### 0.1 Objective

Build a working hackathon MVP for:

**MonadDraw**

A trustless, high-throughput prize distribution engine that lets a sponsor configure a prize, participants mint NFT tickets, a transparent selection process chooses one participant, and the winner automatically claims the prize on-chain.

### 0.2 Build Mode

- Build a **testnet/local demo**.
- Do **not** build a production system.
- Do **not** integrate real-world value transfer.
- Do **not** integrate paid entry.
- Do **not** add operator profit mechanics.
- Do **not** deploy to mainnet.
- Do **not** build features outside the MVP scope unless the MVP is complete.

### 0.3 Non-Negotiable Guardrails

The system must remain a **transparent prize distribution demo**.

Do not implement:

- Paid tickets
- Ticket purchase
- User entry fees
- Sponsor profit from ticket activity
- Operator fees
- Real-world asset custody
- Live mainnet deployment
- Real-user solicitation
- Any mechanic where users pay value for a selection opportunity

If an implementation detail introduces any of the above, stop and remove it.

### 0.4 Fallback Decisions

If the agent gets stuck, use these safe fallbacks:

| Problem | Safe Fallback |
|---|---|
| Monad testnet unavailable | Use local Anvil / Hardhat network |
| Wallet integration too slow | Use local Anvil accounts for demo |
| Randomness integration too complex | Use demo-grade deterministic selection and label it clearly |
| Multi-draw system too complex | Build one draw contract instance for the demo |
| NFT metadata takes too long | Use minimal ERC721 metadata or no metadata |
| Frontend polish takes too long | Prioritize a working transaction flow over visual polish |

### 0.5 Definition of Done

The MVP is complete when:

- [ ] Contracts compile
- [ ] Unit tests pass
- [ ] Demo deployment script works on local EVM
- [ ] Frontend can connect to the deployed draw
- [ ] A participant can mint an NFT ticket
- [ ] The draw can be executed after close
- [ ] The winner can claim the prize
- [ ] Transparency data is displayed
- [ ] README includes scope and demo instructions
- [ ] No paid entry or profit-extraction mechanics exist in the code

---

## 1. Project Overview

### 1.1 Project Name

**MonadDraw**

Alternative names:

- FairDraw
- DrawEngine
- PrizeKit
- TransparentDraw

Use **MonadDraw** as the default.

### 1.2 One-liner

> A trustless, EVM-compatible prize distribution engine for transparent community prize events using NFT tickets, verifiable selection, and automatic prize settlement.

### 1.3 Core Concept

A sponsor configures a prize. Participants mint NFT tickets to join the event. After the participation window closes, the system selects one participant. The selected participant can claim the prize.

The core value is:

- Transparency
- Verifiability
- Automatic settlement
- EVM compatibility
- Strong fit for high-throughput networks like Monad

### 1.4 Demo Story

The hackathon demo tells this story:

1. A sponsor deploys a prize event.
2. The sponsor funds the prize using a demo ERC20 token.
3. Participants mint NFT tickets.
4. The participation window closes.
5. The system selects one participant.
6. The winner claims the prize.
7. The whole process is inspectable on-chain.

---

## 2. Legal and Scope Guardrails

### 2.1 Scope Statement

This project is a **technical demonstration of transparent prize distribution**.

It is:

- A testnet/local demo
- A smart-contract-based participant selection and settlement engine
- A developer-facing protocol primitive

It is not:

- A production application
- A paid participation platform
- A live prize operation
- A real-world asset exchange
- A wagering product

### 2.2 Required README Disclaimer

Include this text in the README:

```md
## Scope and Disclaimer

MonadDraw is a hackathon testnet demonstration of a transparent prize distribution engine.

- No real funds are accepted.
- No real-world assets are transferred.
- Tickets are not sold.
- There is no paid entry.
- There is no operator profit mechanism.
- The demo uses test tokens and local/testnet environments only.

This project is intended as a technical protocol demonstration, not a live production service.
```

### 2.3 UI Copy Rules

Use safe language in the UI.

Prefer:

- Participation ticket
- Prize event
- Participant selection
- Sponsor-funded prize
- Transparent selection
- Testnet demo

Avoid:

- Buy ticket
- Pay to enter
- Raffle
- Lottery
- Odds
- Chance to win
- Organizer profit
- Ticket sale

---

## 3. Core Product Definition

### 3.1 Roles

#### Sponsor

The sponsor:

- Deploys the prize event
- Funds the prize with a demo ERC20 token
- Sets the ticket cap
- Sets the participation duration
- Can cancel before participation if no tickets have been minted
- Can participate as a normal participant under the same rules

The sponsor does **not**:

- Sell tickets
- Take profit
- Privilege extra tickets
- Control the winner beyond the transparent selection mechanism

#### Participant

A participant:

- Mints one NFT ticket
- Becomes eligible for selection
- Can claim the prize if selected

A participant does **not**:

- Pay token value for the ticket
- Buy multiple tickets in MVP
- Transfer tickets in MVP

#### Viewer

A viewer:

- Inspects event status
- Inspects selection data
- Verifies on-chain state
- Can simulate the selection process offline

### 3.2 Core Objects

#### Prize Event

A single prize event contains:

- Prize token
- Prize amount
- Ticket cap
- Open time
- Close time
- Funded amount
- Participant list
- Winner
- Selection seed
- Selected index
- Settlement status

#### Ticket

A ticket is:

- An ERC721 NFT
- Minted once per participant in MVP
- Bound to the prize event
- Non-transferable in the preferred MVP
- Used as proof of participation

#### Prize

The prize is:

- An ERC20 token in MVP
- Funded by the sponsor
- Escrowed by the prize event contract
- Transferred to the winner on claim

---

## 4. MVP Scope

### 4.1 In Scope

The MVP must include:

1. A demo ERC20 prize token
2. A prize event contract
3. ERC721 NFT ticket minting
4. Sponsor funding flow
5. One ticket per participant
6. Ticket cap
7. Time-based participation window
8. Transparent selection execution
9. Winner claim
10. On-chain transparency data
11. Frontend demo
12. Local deployment script
13. Unit tests
14. README

### 4.2 Out of Scope

The MVP must **not** include:

1. Paid tickets
2. Ticket purchase
3. Operator profit
4. Multi-ticket purchases
5. Ticket marketplace
6. Real-world asset custody
7. RWA transfer
8. Multi-draw factory
9. Governance
10. Cross-chain settlement
11. Production randomness
12. Mainnet deployment
13. Live user onboarding
14. Complex authentication
15. Full NFT metadata platform
16. Payments abstraction
17. Sponsor dashboards beyond basic cancel/forfeit functions

---

## 5. User Journeys

### 5.1 Sponsor Creates and Funds a Prize Event

1. Sponsor connects wallet.
2. Sponsor selects prize token.
3. Sponsor enters prize amount.
4. Sponsor enters ticket cap.
5. Sponsor enters participation duration.
6. Sponsor deploys the prize event contract.
7. Sponsor approves the prize event contract to spend the prize token.
8. Sponsor funds the prize event.
9. The event becomes open after funding.

### 5.2 Participant Mints a Ticket

1. Participant connects wallet.
2. Participant views the prize event.
3. Participant sees status: Open.
4. Participant clicks **Mint Participation Ticket**.
5. The contract mints one ERC721 ticket to the participant.
6. The participant is added to the participant list.
7. The UI confirms ticket ownership.

### 5.3 Draw Execution

1. The participation window closes.
2. Anyone can call `executeDraw()`.
3. The contract validates:
   - Event is closed
   - At least one participant exists
   - Prize is funded
4. The contract computes a selection index.
5. The contract stores:
   - Selection seed
   - Selected index
   - Winner address
6. The UI displays the winner.

### 5.4 Winner Claims Prize

1. Winner connects wallet.
2. UI shows status: Drawn.
3. UI shows the connected wallet is the winner.
4. Winner clicks **Claim Prize**.
5. Contract transfers the prize token to the winner.
6. Event status becomes Settled.

### 5.5 Viewer Verification

1. Viewer sees event address.
2. Viewer sees:
   - Prize token
   - Prize amount
   - Participant count
   - Close time
   - Winner
   - Selection seed
   - Selected index
3. Viewer can independently verify that the selected index maps to the displayed winner.

---

## 6. Functional Requirements

### 6.1 Must Have

#### M1 — Deploy Demo Prize Token

The system must deploy a demo ERC20 token.

Requirements:

- Token name: `Demo Prize`
- Token symbol: `DPRZ`
- Initial supply: at least `1000000` tokens
- Decimals: 18

#### M2 — Deploy Prize Event

The system must deploy a prize event contract with:

- Prize token address
- Prize amount
- Ticket cap
- Participation duration

#### M3 — Sponsor Funding

The sponsor must be able to fund the prize event.

Requirements:

- Sponsor must approve the prize event contract.
- Sponsor must call `fundDraw(amount)`.
- Contract must escrow the ERC20 prize.
- Contract must track `fundedAmount`.
- Contract must not allow funding beyond `prizeAmount`.

#### M4 — Ticket Minting

Participants must be able to mint NFT tickets.

Requirements:

- Tickets are ERC721.
- Ticket minting is free.
- No token payment is required.
- Only one ticket per wallet in MVP.
- Minting is allowed only while the event is open.
- Minting stops at the ticket cap.
- Minting requires the event to be fully funded.

#### M5 — Time-Based Participation Window

The event must have:

- Open time
- Close time
- Status transitions

Statuses:

- NotOpen
- Open
- Closed
- Drawn
- Settled
- Cancelled

#### M6 — Selection Execution

The system must allow draw execution after close.

Requirements:

- `executeDraw()` can only succeed when status is `Closed`.
- Must revert if no participants exist.
- Must store:
  - `winner`
  - `drawSeed`
  - `selectedIndex`
- Must emit a `DrawExecuted` event.

#### M7 — Winner Claim

The winner must be able to claim the prize.

Requirements:

- Only the winner can claim.
- Claim must transfer `prizeAmount` of the prize token.
- Claim must set status to `Settled`.
- Claim must emit `PrizeClaimed`.

#### M8 — Transparency Data

The contract and UI must expose:

- `prizeToken`
- `prizeAmount`
- `fundedAmount`
- `ticketCap`
- `openAt`
- `closeAt`
- `participantCount()`
- `participants(index)`
- `isParticipant(address)`
- `winner`
- `drawSeed`
- `selectedIndex`
- `status()`

#### M9 — Local Demo Deployment

The system must include a script that:

- Deploys the demo prize token
- Deploys the prize event
- Funds the prize event
- Optionally mints demo tickets using local test accounts
- Prints addresses and demo information

#### M10 — Frontend Demo

The frontend must support:

- Connect wallet or local demo account
- View event details
- Sponsor funding
- Participant ticket minting
- Draw execution
- Winner claim
- Transparency panel
- Status polling

### 6.2 Should Have

These are valuable if time permits, but not required if the MVP is complete.

#### S1 — Non-Transferable Tickets

Tickets should not be transferable.

If implemented:

- Revert `transferFrom`
- Revert `safeTransferFrom`
- Revert `approve`
- Revert `setApprovalForAll`

#### S2 — Sponsor Cancel

The sponsor should be able to cancel the event before close if no participants have minted tickets.

#### S3 — Sponsor Forfeit

If the event closes with no participants, the sponsor should be able to withdraw the funded prize.

#### S4 — Demo Account Selection

The frontend should support local Anvil accounts for easy demo without requiring MetaMask setup.

#### S5 — Transaction Toasts

The UI should show transaction status and error messages.

### 6.3 Won’t Have in MVP

Do not build these in MVP:

- Paid minting
- Ticket resale
- Multiple tickets per participant
- Multi-prize events
- Tournament logic
- NFT prize support
- ERC1155 support
- RWA references
- VRF integration
- Chainlink integration
- Multi-chain settlement
- User registration
- Email onboarding
- Admin dashboards
- Analytics dashboards
- Sponsor revenue share
- Operator incentives

---

## 7. Non-Functional Requirements

### 7.1 Compatibility

- Must be EVM-compatible.
- Must work on local Hardhat/Anvil.
- Should be deployable to Monad testnet if available.
- Should not require Monad-specific opcodes for MVP.

### 7.2 Performance

- MVP does not require gas optimization.
- Keep contract logic simple.
- Use public arrays and mappings for easy inspection.
- Avoid unnecessary storage writes.

### 7.3 Security

- Use well-known OpenZeppelin contracts.
- Add basic unit tests.
- Do not use `address(this).balance` assumptions for ERC20.
- Validate input in all external functions.
- Use custom errors where practical.
- Do not use `tx.origin` for access control.

### 7.4 Usability

- Frontend must be usable in under 5 minutes.
- Demo must not require reading long documentation.
- Buttons must clearly show state.
- Transaction errors must be visible.
- UI must show current on-chain status.

### 7.5 Transparency

- All key state must be readable from the contract.
- The UI must display the data needed to verify the selection.
- Events must be emitted for:
  - Funding
  - Ticket minting
  - Draw execution
  - Prize claim

---

## 8. Technical Architecture

### 8.1 Recommended Stack

Use this stack unless there is a strong reason not to.

#### Smart Contracts

- Solidity `^0.8.24`
- OpenZeppelin Contracts `^5`
- Hardhat
- Ethers v6
- Chai for tests

#### Frontend

- Vite
- React
- TypeScript
- Tailwind CSS
- Ethers v6

#### Local Blockchain

- Hardhat network or Anvil
- Default local RPC: `http://127.0.0.1:8545`

#### Optional

- Next.js instead of Vite only if the team already has an existing setup.
- MetaMask support only after local demo works.

### 8.2 Why This Fits Monad

Monad is an EVM-compatible high-throughput network.

This project fits because:

- It uses standard Solidity and ERC standards.
- Ticket minting can involve many participants in a short window.
- High throughput improves the participant experience.
- The MVP can be deployed with standard EVM tooling.
- Future versions can use Monad-specific ecosystem tools if needed.

### 8.3 High-Level Data Flow

```text
Sponsor
  ↓ deploys
PrizeDraw contract
  ↓ receives
ERC20 prize token
  ↓ funded event opens
Participants
  ↓ mint
ERC721 tickets
  ↓ event closes
executeDraw()
  ↓ selects
Winner
  ↓ claims
ERC20 prize token
```

### 8.4 Recommended Repository Structure

```text
/
  contracts/
    PrizeToken.sol
    PrizeDraw.sol
  test/
    PrizeDraw.test.js
  scripts/
    deploy-demo.js
  hardhat.config.js
  package.json
  web/
    public/
    src/
      main.tsx
      App.tsx
      components/
        ConnectWallet.tsx
        CreateDrawForm.tsx
        EventStatusCard.tsx
        TicketPanel.tsx
        DrawControls.tsx
        TransparencyPanel.tsx
      lib/
        wallet.ts
        draw.ts
        constants.ts
      abi/
        PrizeToken.json
        PrizeDraw.json
    index.html
    vite.config.ts
    tailwind.config.js
    postcss.config.js
    package.json
  README.md
  DISCLAIMER.md
```

### 8.5 Environment Variables

#### Root / Contracts

```env
PRIVATE_KEY=
RPC_URL=http://127.0.0.1:8545
```

#### Frontend

```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_PRIZE_TOKEN_ADDRESS=
VITE_DRAW_ADDRESS=
VITE_DEMO_SPONSOR_PRIVATE_KEY=
VITE_DEMO_PARTICIPANT_PRIVATE_KEY=
```

Use local Anvil keys only.

Do not use mainnet keys.

Do not commit real private keys.

---

## 10. Frontend Specification

### 10.1 UI Goal

The UI should be simple, clean, and demo-focused.

Do not overbuild.

The best UI is one where the judge can understand the flow in 30 seconds.

### 10.2 Main Screen

Use a single-page layout with sections:

1. Header
2. Event Status
3. Sponsor Panel
4. Participant Panel
5. Transparency Panel

### 10.3 Header

Display:

- Project name: **MonadDraw**
- Network label: `Local Demo` or `Testnet`
- Connect button
- Connected wallet address

### 10.4 Event Status Card

Display:

- Event address
- Status
- Prize token symbol
- Prize amount
- Funded amount
- Ticket cap
- Participant count
- Close time
- Winner, if selected

Status mapping:

```ts
const STATUS_LABELS = {
  0: "Not Open",
  1: "Open",
  2: "Closed",
  3: "Drawn",
  4: "Settled",
  5: "Cancelled"
};
```

### 10.5 Sponsor Panel

Visible only when connected wallet is sponsor.

Actions:

- Fund draw
- Cancel draw
- Forfeit prize

Fields:

- Fund amount
- Token address
- Draw address

### 10.6 Participant Panel

Visible to any connected wallet.

Actions:

- Mint Participation Ticket

Disabled states:

- If event is not open
- If connected wallet already has ticket
- If ticket cap is reached

Button copy:

- `Mint Participation Ticket`

Do not use:

- Buy ticket
- Enter now
- Claim chance

### 10.7 Draw Controls

Visible when event is closed and not drawn.

Action:

- Execute Selection

Button copy:

- `Execute Selection`

Do not use:

- Run lottery
- Open raffle

### 10.8 Claim Panel

Visible only when connected wallet is winner.

Action:

- Claim Prize

Button copy:

- `Claim Prize`

### 10.9 Transparency Panel

Display:

- Winner address
- Selection seed
- Selected index
- Participant count
- Transaction hashes, if available
- Raw verification note

Example copy:

```md
The selected index maps directly to the participant list stored in the contract.
Anyone can verify that the winner is `participants[selectedIndex]`.
```

### 10.10 State Management

Keep state local and simple.

Use:

- `useEffect` polling every 3–5 seconds
- Local React state for:
  - provider
  - signer
  - account
  - draw contract
  - prize token contract
  - event data
  - transaction status
  - error message

Do not add a backend.

### 10.11 Wallet Strategy

#### Preferred MVP Strategy

Use local Anvil accounts.

Why:

- Faster setup
- No MetaMask configuration
- Reliable demo

Implementation:

- Create a small wallet abstraction.
- If `window.ethereum` exists, use injected wallet.
- Otherwise, allow local Anvil account connection using private keys from environment variables.

#### Fallback Strategy

If local account connection becomes too complex:

- Use one hardcoded local Anvil account for demo.
- Allow a second local Anvil account via environment variable.
- Keep MetaMask optional.

### 10.12 Component List

Build these components:

```text
ConnectWallet
EventStatusCard
SponsorPanel
ParticipantPanel
DrawControls
TransparencyPanel
TransactionStatus
```

### 10.13 UI Styling Requirements

- Dark or clean light theme
- Clear card layout
- Obvious button states
- Monospace font for addresses and hashes
- Status colors:
  - Blue: Not Open
  - Green: Open
  - Yellow: Closed
  - Purple: Drawn
  - Gray: Settled
  - Red: Cancelled

### 10.14 Required User Interactions

The UI must support this demo:

1. Connect sponsor
2. Fund event
3. Connect participant
4. Mint ticket
5. Wait or fast-forward close
6. Execute selection
7. Connect winner
8. Claim prize

---

## 11. Deployment and Demo

### 11.1 Local Development Flow

```bash
# Start local node
npx hardhat node

# Compile
npx hardhat compile

# Run tests
npx hardhat test

# Deploy demo
npx hardhat run scripts/deploy-demo.js
```

### 11.2 Demo Parameters

Use these default demo parameters:

| Parameter | Value |
|---|---:|
| Prize token supply | 1,000,000 |
| Prize amount | 100 |
| Ticket cap | 10 |
| Duration | 300 seconds |
| Tickets per address | 1 |

### 11.3 Deploy Script Behavior

The deploy script must:

1. Deploy `PrizeToken`
2. Deploy `PrizeDraw`
3. Approve `PrizeDraw` to spend prize tokens
4. Call `fundDraw`
5. Optionally mint tickets from two local accounts
6. Print:
   - Prize token address
   - Prize draw address
   - Sponsor address
   - Participant addresses
   - Suggested duration

Example script:

```js
const { ethers } = require("hardhat");

async function main() {
    const [sponsor, user1, user2] = await ethers.getSigners();

    const PrizeToken = await ethers.getContractFactory("PrizeToken");
    const token = await PrizeToken.deploy(ethers.parseUnits("1000000", 18));
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
    const prizeAmount = ethers.parseUnits("100", 18);
    const ticketCap = 10;
    const duration = 300;

    const draw = await PrizeDraw.deploy(tokenAddress, prizeAmount, ticketCap, duration);
    await draw.waitForDeployment();
    const drawAddress = await draw.getAddress();

    await token.connect(sponsor).approve(drawAddress, prizeAmount);
    await draw.connect(sponsor).fundDraw(prizeAmount);

    const status = await draw.status();
    const funded = await draw.fundedAmount();

    console.log("Sponsor:", sponsor.address);
    console.log("PrizeToken:", tokenAddress);
    console.log("PrizeDraw:", drawAddress);
    console.log("Status:", status.toString());
    console.log("Funded:", ethers.formatUnits(funded, 18));

    await draw.connect(user1).mintTicket();
    await draw.connect(user2).mintTicket();

    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("Participant count:", (await draw.participantCount()).toString());

    console.log("\nDemo ready.");
    console.log("Wait for close, then call executeDraw().");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

### 11.4 Demo Accounts

For local demo:

- Account 0: Sponsor
- Account 1: Participant A
- Account 2: Participant B

If using Anvil:

```bash
anvil
```

Use the printed accounts or default local keys.

### 11.5 Demo Scenario

#### Scenario A — Participant Wins

1. Deploy demo.
2. Two participants mint tickets.
3. Close event.
4. Execute selection.
5. If participant wins:
   - Connect participant wallet
   - Claim prize
6. Show transparency panel.

#### Scenario B — Sponsor Wins

1. Deploy demo.
2. Sponsor also mints ticket.
3. Close event.
4. Execute selection.
5. If sponsor wins:
   - Connect sponsor wallet
   - Claim prize
6. Show transparency panel.

### 11.6 Presentation Demo

Recommended live demo:

1. Show deployed event in UI.
2. Show sponsor funding already complete.
3. Mint one ticket from participant wallet.
4. Show participant list update.
5. Execute selection after close.
6. Show winner.
7. Claim prize with winner wallet.
8. Show transparency data.
9. Show README scope disclaimer.

---

## 12. Testing Plan

### 12.1 Required Unit Tests

Write tests for `PrizeDraw`.

#### Deployment Tests

- [ ] Deploys with valid parameters
- [ ] Reverts if prize token is zero address
- [ ] Reverts if prize amount is zero
- [ ] Reverts if ticket cap is zero
- [ ] Reverts if duration is zero

#### Funding Tests

- [ ] Sponsor can fund draw
- [ ] Non-sponsor cannot fund draw
- [ ] Funding beyond prize amount reverts
- [ ] Zero funding amount reverts

#### Minting Tests

- [ ] Cannot mint before open
- [ ] Cannot mint before fully funded
- [ ] Participant can mint one ticket
- [ ] Participant cannot mint twice
- [ ] Cannot mint beyond ticket cap
- [ ] Cannot mint after close

#### Execution Tests

- [ ] Cannot execute before close
- [ ] Cannot execute with no participants
- [ ] Can execute after close
- [ ] Execution stores winner
- [ ] Execution stores seed
- [ ] Execution stores selected index
- [ ] Cannot execute twice

#### Claim Tests

- [ ] Non-winner cannot claim
- [ ] Winner can claim
- [ ] Claim transfers prize token
- [ ] Claim sets settled state
- [ ] Claim cannot be called twice

### 12.2 Test Setup

Use:

- Hardhat
- Chai
- Time manipulation via Hardhat tooling

Example test outline:

```js
const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("PrizeDraw", function () {
    async function deployFixture() {
        const [sponsor, alice, bob] = await ethers.getSigners();

        const PrizeToken = await ethers.getContractFactory("PrizeToken");
        const token = await PrizeToken.deploy(ethers.parseUnits("1000000", 18));
        await token.waitForDeployment();

        const prizeAmount = ethers.parseUnits("100", 18);
        const ticketCap = 5;
        const duration = 600;

        const PrizeDraw = await ethers.getContractFactory("PrizeDraw");
        const draw = await PrizeDraw.deploy(
            await token.getAddress(),
            prizeAmount,
            ticketCap,
            duration
        );
        await draw.waitForDeployment();

        await token.connect(sponsor).approve(await draw.getAddress(), prizeAmount);
        await draw.connect(sponsor).fundDraw(prizeAmount);

        return { sponsor, alice, bob, token, draw, prizeAmount };
    }

    it("funds and opens draw", async function () {
        const { draw } = await loadFixture(deployFixture);
        expect((await draw.status()).toString()).to.equal("1");
    });

    it("mints ticket to participant", async function () {
        const { draw, alice } = await loadFixture(deployFixture);
        await draw.connect(alice).mintTicket();
        expect(await draw.isParticipant(alice.address)).to.equal(true);
    });

    it("executes and claims prize", async function () {
        const { draw, alice, bob, token, prizeAmount } = await loadFixture(deployFixture);

        await draw.connect(alice).mintTicket();
        await draw.connect(bob).mintTicket();

        await time.increase(601);
        await draw.executeDraw();

        const winner = await draw.winner();
        expect(winner).to.be.oneOf([alice.address, bob.address]);

        if (winner === alice.address) {
            await draw.connect(alice).claimPrize();
            expect(await token.balanceOf(alice.address)).to.equal(prizeAmount);
        } else {
            await draw.connect(bob).claimPrize();
            expect(await token.balanceOf(bob.address)).to.equal(prizeAmount);
        }
    });
});
```

### 12.3 Integration Smoke Test

Run this manually before demo:

1. Start Hardhat node.
2. Run deploy script.
3. Open frontend.
4. Connect sponsor.
5. Confirm funded state.
6. Connect participant.
7. Mint ticket.
8. Execute draw after close.
9. Claim prize.
10. Confirm status is Settled.

---

## 13. Two-Hour Build Plan

### 13.1 Timing

Total: 2 hours

### 13.2 Plan

#### 0:00 – 0:10 — Setup

- Scaffold repo
- Initialize Hardhat
- Install dependencies:
  - `hardhat`
  - `@nomicfoundation/hardhat-toolbox`
  - `@openzeppelin/contracts`
  - `ethers`
- Scaffold Vite React app
- Install frontend dependencies:
  - `ethers`
  - `tailwindcss`
  - `postcss`
  - `autoprefixer`

#### 0:10 – 0:35 — Contracts

- Write `PrizeToken.sol`
- Write `PrizeDraw.sol`
- Compile
- Fix compile errors
- Add basic tests
- Get tests passing

#### 0:35 – 0:50 — Deploy Script

- Write `scripts/deploy-demo.js`
- Run local node
- Deploy demo
- Verify:
  - Token deployed
  - Draw deployed
  - Funding works
  - Ticket minting works
  - Execution works
  - Claim works

#### 0:50 – 1:30 — Frontend

- Connect wallet / local account
- Load draw address
- Fetch event state
- Build status card
- Build sponsor panel
- Build participant panel
- Build draw controls
- Build claim panel
- Build transparency panel
- Poll state
- Handle transaction errors

#### 1:30 – 1:50 — Demo Polish

- Run full demo scenario
- Fix UI bugs
- Add demo notes
- Add README
- Add disclaimer
- Add transparency verification note

#### 1:50 – 2:00 — Final Check

- Run tests again
- Restart node
- Redeploy fresh demo
- Re-run UI flow
- Prepare screenshot or short video
- Finalize README

### 13.3 Time-Cut Priorities

If behind schedule, cut in this order:

1. Sponsor cancel / forfeit
2. Transparency panel extras
3. Local account selection
4. NFT metadata
5. Visual polish
6. Optional tests beyond core flows

Never cut:

- Mint ticket
- Execute selection
- Claim prize
- README disclaimer

---

## 14. Acceptance Criteria

### 14.1 Contract Acceptance Criteria

| ID | Criteria |
|---|---|
| C1 | `PrizeToken` deploys successfully |
| C2 | `PrizeDraw` deploys successfully |
| C3 | Sponsor can fund draw |
| C4 | Non-sponsor cannot fund draw |
| C5 | Draw opens only after full funding |
| C6 | Participant can mint one ticket |
| C7 | Participant cannot mint twice |
| C8 | Ticket cap is enforced |
| C9 | Draw cannot execute before close |
| C10 | Draw cannot execute with zero participants |
| C11 | Draw stores winner, seed, and selected index |
| C12 | Winner can claim prize |
| C13 | Non-winner cannot claim prize |
| C14 | Claim sets settled state |
| C15 | No payable functions exist in MVP |

### 14.2 Frontend Acceptance Criteria

| ID | Criteria |
|---|---|
| F1 | User can connect to local environment |
| F2 | UI displays event address |
| F3 | UI displays status |
| F4 | UI displays prize details |
| F5 | UI displays participant count |
| F6 | Sponsor can fund from UI or script |
| F7 | Participant can mint ticket from UI |
| F8 | UI disables mint after close |
| F9 | UI disables duplicate mint |
| F10 | User can execute selection after close |
| F11 | UI displays winner |
| F12 | Winner can claim prize from UI |
| F13 | UI displays transparency data |
| F14 | UI shows transaction errors clearly |

### 14.3 Documentation Acceptance Criteria

| ID | Criteria |
|---|---|
| D1 | README includes project summary |
| D2 | README includes demo instructions |
| D3 | README includes scope disclaimer |
| D4 | README includes contract addresses for demo |
| D5 | README includes future roadmap |
| D6 | README explains why Monad is a good fit |

### 14.4 Security and Scope Acceptance Criteria

| ID | Criteria |
|---|---|
| S1 | No real funds are accepted |
| S2 | No ticket purchase exists |
| S3 | No operator profit exists |
| S4 | No mainnet deployment is included |
| S5 | README clearly labels demo randomness as prototype-grade |
| S6 | UI avoids paid-entry language |

---

## 15. Demo Script

Use this script for the live demo.

### Opening

> “MonadDraw is a trustless prize distribution engine built for high-throughput EVM networks. It lets a sponsor set a prize, participants mint NFT tickets, and the system transparently selects one participant who can automatically claim the prize.”

### Demo Flow

1. “Here is the deployed prize event on a local EVM environment.”
2. “The sponsor has deposited the prize token into the contract.”
3. “Now a participant mints a participation ticket.”
4. “The ticket is an NFT, and the participant is added on-chain.”
5. “Once the window closes, the selection can be executed.”
6. “The contract stores the seed, selected index, and winner.”
7. “Anyone can verify that the winner is the participant at the selected index.”
8. “The winner now claims the prize.”
9. “The prize is transferred directly from the contract to the winner.”
10. “Everything is transparent, verifiable, and EVM-compatible.”

### Closing

> “This MVP demonstrates a transparent participant selection and prize settlement engine. In production, randomness would be upgraded to a secure method, and additional asset types could be supported through modular extensions.”

---

## 16. Future Extensions

These are for the roadmap only. Do not build them in MVP.

### 16.1 Protocol Extensions

- Multi-draw factory
- Batch ticket minting
- Multi-ticket support
- Sponsor treasury modules
- Eligibility modules
- Attestation-based participation
- Reusable draw SDK

### 16.2 Asset Extensions

- NFT prizes
- ERC1155 prizes
- Multi-asset prize bundles
- Tokenized reward points
- Attestation-backed real-world rewards

### 16.3 Security Extensions

- VRF integration
- Commit-reveal selection
- Oracle-backed randomness
- Threshold signatures
- Audited access control
- Formal verification

### 16.4 Experience Extensions

- Sponsor dashboard
- Participant dashboard
- Public explorer
- Analytics
- Notifications
- Multi-event discovery
- Whitelisted participant pools

---

## 17. Risk Register

### 17.1 Randomness Risk

Risk:

- Demo-grade randomness may be criticized.

Mitigation:

- Clearly label it as prototype-grade.
- Store seed and selected index.
- State production path: VRF, commit-reveal, or oracle-backed randomness.

### 17.2 Scope Creep Risk

Risk:

- Team adds paid entry, marketplaces, or real-world assets.

Mitigation:

- Enforce non-goals.
- Review UI copy.
- Review contract functions before deploy.

### 17.3 Wallet Setup Risk

Risk:

- MetaMask + local network setup eats time.

Mitigation:

- Use local Anvil accounts.
- Keep wallet connection optional.

### 17.4 Network Availability Risk

Risk:

- Monad testnet may be unstable or unavailable.

Mitigation:

- Use local EVM.
- Keep contracts standard EVM.
- Include testnet deployment instructions as optional.

### 17.5 Token Standard Risk

Risk:

- Non-standard ERC20 behavior can break funding or claim logic.
- Some tokens have:
  - unusual approval semantics
  - fee-on-transfer behavior
  - rebasing balances
  - no standard `decimals()`
  - failed `transfer()` that does not revert

Mitigation:

- Use the project-owned `PrizeToken` for MVP.
- Do not integrate external tokens in the hackathon build unless the MVP is complete.
- If external tokens are supported later:
  - validate token behavior
  - avoid fee-on-transfer tokens in demo
  - use standard ERC20 transfers
  - consider OpenZeppelin `SafeERC20` patterns
- Document that MVP uses a demo token only.

---

### 17.6 UI Copy Risk

Risk:

- Accidental user-facing language can make the project look like a paid-entry prize mechanism.
- Judges or reviewers may interpret ambiguous wording incorrectly.

Mitigation:

- Use the approved copy only.
- Avoid paid-entry wording.
- Use neutral, technical, transparency-focused language.

Recommended copy table:

| Avoid | Use Instead |
|---|---|
| Buy ticket | Mint participation ticket |
| Pay to enter | Join with participation ticket |
| Ticket price | Ticket status |
| Raffle | Prize event |
| Lottery | Participant selection |
| Odds | Eligibility |
| Chance to win | Eligible for selection |
| Organizer profit | Sponsor-funded prize |
| Winner takes all | Selected participant claims prize |
| Enter now | Mint participation ticket |
| Pay fee | No fee required |
| Real prize value | Demo prize token |

Allowed phrases:

- Sponsor-funded prize
- Participation ticket
- Transparent selection
- Verifiable on-chain state
- Testnet demonstration
- Demo token
- Automatic prize settlement

---

### 17.7 Legal / Scope Framing Risk

Risk:

- The project could be misread as a regulated prize operation if framed poorly.

Mitigation:

- Keep the project framed as a **transparent prize distribution engine**.
- Keep participation **free**.
- Keep prize funding **sponsor-controlled**.
- Keep demo assets **non-real-value**.
- Include the required disclaimer.
- Avoid operator profit mechanics.
- Avoid “purchase” or “paid entry” in UI, README, pitch, and code comments.

Safe positioning:

> MonadDraw is a testnet protocol demo for transparent, verifiable prize distribution using NFT participation tickets and automatic on-chain settlement.

---

### 17.8 Time Risk

Risk:

- Scope expansion can prevent a working demo by the deadline.

Mitigation:

- Build MVP first.
- Do not start roadmap features until all acceptance criteria are met.
- Prefer fewer working screens over more incomplete screens.
- If time is running out, reduce UI polish before removing core flow.

Priority order if behind schedule:

1. Contracts compile.
2. Unit tests pass.
3. Deploy script works.
4. UI can mint ticket.
5. UI can execute selection.
6. UI can claim prize.
7. Transparency panel.
8. Sponsor cancel / forfeit.
9. Visual polish.
10. Optional integrations.

---

### 17.9 Network Compatibility Risk

Risk:

- Monad-specific tooling may be unavailable, unstable, or unfamiliar during the hackathon.

Mitigation:

- Use standard EVM contracts.
- Use Hardhat / Anvil for the primary demo.
- Treat Monad testnet deployment as optional.
- Ensure contracts do not depend on Monad-specific opcodes for MVP.
- Keep deployment script environment-variable driven so RPC can be switched later.

---

### 17.10 Verification Risk

Risk:

- Viewers may not understand how the selected participant was chosen.
- If only the winner address is shown, the transparency story is weaker.

Mitigation:

- Display:
  - `selectedIndex`
  - `drawSeed`
  - `participantCount`
  - full participant list if count is small
  - winner address
- For MVP with small ticket cap, fetch and display participants in order.
- Highlight the participant at `selectedIndex`.
- Add a short verification note:

```md
The winner is selected by mapping `selectedIndex` to the on-chain `participants` array.
Anyone can verify that `participants[selectedIndex]` equals the displayed winner address.
```

---

### 17.11 Dependency Risk

Risk:

- Version mismatches between Hardhat, OpenZeppelin, Ethers, and React can consume time.

Mitigation:

- Use one known-good stack.
- Pin major versions where reasonable.
- Install dependencies early.
- Compile contracts before building UI.
- Do not upgrade dependencies mid-build unless necessary.

Recommended versions:

```text
Solidity: ^0.8.24
OpenZeppelin: ^5
Ethers: ^6
Hardhat: latest stable
Vite: latest stable
React: 18 or 19
TypeScript: latest stable
```

---

## 18. Agent Task Decomposition

This section is for AI agents or developers executing the build.

### 18.1 Task Order

Execute tasks in this order:

1. Repository setup
2. Contract implementation
3. Contract tests
4. Deploy script
5. Frontend implementation
6. Demo validation
7. Documentation
8. Final QA

Do not parallelize risky work unless the agent can merge cleanly.

---

### 18.2 Contract Agent Tasks

#### CT-01: Create prize token

Files:

- `contracts/PrizeToken.sol`

Requirements:

- ERC20 token
- Name: `Demo Prize`
- Symbol: `DPRZ`
- Decimals: 18
- Initial supply: `1000000` tokens
- Supply minted to deployer

Done when:

- Contract compiles.
- Token can be deployed.

---

#### CT-02: Create prize event contract

Files:

- `contracts/PrizeDraw.sol`

Requirements:

- Inherits OpenZeppelin ERC721
- Sponsor configures prize, cap, duration
- Sponsor funds ERC20 prize
- Participants mint free NFT tickets
- One ticket per participant
- Time-based open/close
- Execute selection after close
- Winner claims prize
- Transparency state exposed
- Transfer/approval disabled for MVP tickets

Done when:

- Contract compiles.
- No payable functions exist.
- No paid-entry logic exists.

---

#### CT-03: Add state and view functions

Requirements:

- `status()`
- `participantCount()`
- `participants(uint256)`
- `isParticipant(address)`
- `participantTicketId(address)`
- `winner`
- `drawSeed`
- `selectedIndex`
- `fundedAmount`

Done when:

- All view functions return correct values in tests.

---

#### CT-04: Add events

Requirements:

- `DrawCreated`
- `PrizeFunded`
- `TicketMinted`
- `DrawExecuted`
- `PrizeClaimed`
- `DrawCancelled`

Done when:

- Events are emitted at correct lifecycle points.

---

#### CT-05: Add custom errors

Requirements:

- Use custom errors for invalid state transitions.
- Avoid `require` with broad strings if possible.
- Keep error messages descriptive.

Done when:

- Tests assert correct reverts.

---

### 18.3 Test Agent Tasks

#### TE-01: Deployment tests

Required tests:

- Valid deployment succeeds.
- Zero token address reverts.
- Zero prize amount reverts.
- Zero ticket cap reverts.
- Zero duration reverts.

---

#### TE-02: Funding tests

Required tests:

- Sponsor can fund draw.
- Non-sponsor cannot fund draw.
- Funding beyond prize amount reverts.
- Zero funding reverts.
- Draw status is `NotOpen` before full funding.

---

#### TE-03: Ticket minting tests

Required tests:

- Cannot mint before open.
- Cannot mint before fully funded.
- Participant can mint one ticket.
- Participant cannot mint twice.
- Cannot mint beyond cap.
- Cannot mint after close.

---

#### TE-04: Selection tests

Required tests:

- Cannot execute before close.
- Cannot execute with zero participants.
- Execution stores `winner`.
- Execution stores `drawSeed`.
- Execution stores `selectedIndex`.
- Execution sets status to `Drawn`.
- Execution cannot run twice.

---

#### TE-05: Claim tests

Required tests:

- Non-winner cannot claim.
- Winner can claim.
- Prize token balance transfers correctly.
- Claim sets status to `Settled`.
- Claim cannot run twice.

---

### 18.4 Deploy Script Agent Tasks

#### DS-01: Create local deploy script

Files:

- `scripts/deploy-demo.js`

Requirements:

- Deploy `PrizeToken`
- Deploy `PrizeDraw`
- Approve token
- Fund draw
- Optionally mint tickets from local accounts
- Print addresses and demo metadata

Done when:

- `npx hardhat run scripts/deploy-demo.js` succeeds.
- Console output includes:
  - sponsor address
  - prize token address
  - draw address
  - participant count
  - suggested demo duration

---

### 18.5 Frontend Agent Tasks

#### FE-01: Scaffold frontend

Files:

- `web/`

Requirements:

- Vite + React + TypeScript
- Tailwind CSS
- Ethers v6
- Simple single-page layout

Done when:

- `npm run dev` serves the app.

---

#### FE-02: Wallet/provider connection

Files:

- `web/src/lib/wallet.ts`
- `web/src/components/ConnectWallet.tsx`

Requirements:

- Connect local Anvil account or injected wallet if present.
- Display connected address.
- Support at least two local accounts for demo.

Done when:

- User can connect and see address.

---

#### FE-03: Contract loading

Files:

- `web/src/lib/draw.ts`
- `web/src/abi/PrizeDraw.json`
- `web/src/abi/PrizeToken.json`

Requirements:

- Load `PrizeDraw` contract.
- Load `PrizeToken` contract.
- Read event state.
- Poll every 3–5 seconds.

Done when:

- UI reflects on-chain status changes.

---

#### FE-04: Event status card

Files:

- `web/src/components/EventStatusCard.tsx`

Requirements:

- Display:
  - draw address
  - status
  - prize token
  - prize amount
  - funded amount
  - ticket cap
  - participant count
  - close time
  - winner if drawn

Done when:

- Status updates as demo progresses.

---

#### FE-05: Sponsor panel

Files:

- `web/src/components/SponsorPanel.tsx`

Requirements:

- Show only to sponsor.
- Fund draw button.
- Cancel/forfeit buttons if implemented.
- Show funded amount.

Done when:

- Sponsor can fund from UI or use deploy script.

---

#### FE-06: Participant panel

Files:

- `web/src/components/ParticipantPanel.tsx`

Requirements:

- Show `Mint Participation Ticket`.
- Disable if not open.
- Disable if already participant.
- Disable if cap reached.
- Show ticket ID after mint.

Done when:

- Participant can mint exactly one ticket.

---

#### FE-07: Selection controls

Files:

- `web/src/components/DrawControls.tsx`

Requirements:

- Show `Execute Selection` when status is `Closed`.
- Disable if no participants.
- Show success/error state.

Done when:

- Selection can be executed from UI.

---

#### FE-08: Claim panel

Files:

- `web/src/components/ClaimPanel.tsx`

Requirements:

- Show only to winner.
- Button: `Claim Prize`.
- Disable if not drawn.
- Show settled state after claim.

Done when:

- Winner can claim prize from UI.

---

#### FE-09: Transparency panel

Files:

- `web/src/components/TransparencyPanel.tsx`

Requirements:

- Display:
  - winner
  - draw seed
  - selected index
  - participant count
  - participant list if count is small
  - verification note
- Highlight participant at selected index.

Done when:

- A viewer can verify winner from displayed data.

---

### 18.6 QA Agent Tasks

#### QA-01: Run full local demo

Required steps:

1. Start Hardhat node.
2. Compile contracts.
3. Run tests.
4. Run deploy script.
5. Start frontend.
6. Connect sponsor.
7. Verify funded state.
8. Connect participant.
9. Mint ticket.
10. Execute selection after close.
11. Connect winner.
12. Claim prize.
13. Verify settled state.

Done when:

- Entire flow works without manual database edits.

---

#### QA-02: Scan for forbidden language

Scan:

- `web/src`
- `README.md`
- presentation copy
- demo script

Avoid:

```text
buy
purchase
paid
pay to enter
ticket price
fee
profit
raffle
lottery
odds
chance to win
```

Allowed exceptions:

- `nonpayable` in Solidity is acceptable.
- “No paid entry” in disclaimer is acceptable.
- “No real funds are accepted” is acceptable.

Done when:

- User-facing copy uses approved language only.

---

#### QA-03: Verify scope guardrails

Check:

- No payable functions in MVP contracts.
- No ticket purchase function.
- No operator profit function.
- No real-world asset transfer.
- No mainnet deployment script.
- README includes scope disclaimer.

Done when:

- All guardrails pass.

---

### 18.7 Documentation Agent Tasks

#### DO-01: Write README

Required sections:

- Project name
- One-liner
- Problem
- Solution
- Why Monad
- MVP scope
- What is not included
- Demo instructions
- Contract addresses
- Test instructions
- Roadmap
- Disclaimer

Done when:

- A new viewer can run the demo in under 10 minutes.

---

#### DO-02: Write demo script

Required content:

- 60–90 second spoken demo script
- 5 bullet talking points
- judge Q&A answers

Done when:

- Demo can be delivered confidently without improvising.

---

## 19. Forbidden Language Scan

Run this check before final submission.

Scan only user-facing files:

```bash
rg -n -i \
  "(buy ticket|purchase ticket|pay to enter|ticket price|entry fee|organizer profit|raffle|lottery|odds|chance to win)" \
  web/src README.md
```

If any match appears, replace it using the approved copy table.

Do not flag these as violations:

- `nonpayable` in Solidity
- `No paid entry`
- `No real funds are accepted`
- `Demo token`
- `Sponsor-funded prize`

---

## 20. Mandatory README Template

Use this README structure.

```md
# MonadDraw

MonadDraw is a trustless, EVM-compatible prize distribution engine for transparent community prize events using NFT participation tickets, verifiable selection, and automatic prize settlement.

## One-liner

A high-throughput, EVM-compatible prize distribution engine that enables transparent, sponsor-funded community prize events.

## Problem

Community prize events are often centralized and hard to verify.

Participants usually need to trust that:

- the prize was properly funded
- the selection process was transparent
- the prize was sent to the selected participant
- the event state can be inspected after the fact

## Solution

MonadDraw provides an on-chain prize event engine where:

- a sponsor funds a prize token
- participants mint free NFT participation tickets
- the event has a transparent participation window
- a selection process chooses one participant
- the selected participant claims the prize automatically
- all key state is inspectable on-chain

## Why Monad

Monad is an EVM-compatible high-performance network.

MonadDraw fits Monad because:

- prize events can involve sudden bursts of participation
- ticket minting can happen from many participants quickly
- low latency improves the participant experience
- standard EVM tooling can be used for development and deployment
- NFT and ERC20 standards are natively compatible

## MVP Scope

The hackathon MVP includes:

- demo ERC20 prize token
- sponsor-funded prize event
- ERC721 participation tickets
- one ticket per participant
- ticket cap
- time-based participation window
- transparent selection execution
- winner prize claim
- frontend demo
- local EVM deployment
- unit tests

## Not Included in MVP

The MVP does not include:

- paid entry
- ticket purchase
- operator profit
- real-world asset custody
- production randomness
- mainnet deployment
- live user onboarding
- multi-asset prize settlement
- ticket resale
- governance
- cross-chain settlement

## Demo Instructions

### Prerequisites

- Node.js
- npm
- Hardhat
- Vite

### 1. Install dependencies

```bash
npm install
cd web
npm install
```

### 2. Start local node

```bash
npx hardhat node
```

Keep this terminal open.

### 3. Compile contracts

In a new terminal:

```bash
npx hardhat compile
```

### 4. Run tests

```bash
npx hardhat test
```

### 5. Deploy demo

```bash
npx hardhat run scripts/deploy-demo.js
```

Copy the printed addresses into the frontend environment file.

### 6. Start frontend

```bash
cd web
npm run dev
```

Open the local frontend URL.

## Demo Flow

1. Sponsor funds the prize event.
2. Participant mints a participation ticket.
3. Participation window closes.
4. Selection is executed.
5. Winner claims the prize.
6. Transparency panel displays verification data.

## Contract Addresses

Fill in after deployment:

```text
Sponsor:
PrizeToken:
PrizeDraw:
```

## Roadmap

Future extensions may include:

- multi-draw factory
- NFT prizes
- multi-asset prize bundles
- eligibility modules
- VRF or commit-reveal selection
- sponsor dashboards
- public explorer
- tokenized rewards
- attestation-backed real-world rewards

## Scope and Disclaimer

MonadDraw is a hackathon testnet demonstration of a transparent prize distribution engine.

- No real funds are accepted.
- No real-world assets are transferred.
- Tickets are not sold.
- There is no paid entry.
- There is no operator profit mechanism.
- The demo uses test tokens and local/testnet environments only.

This project is intended as a technical protocol demonstration, not a live production service.

## Randomness Note

The MVP uses demo-grade selection for the hackathon build.

In production, selection would be upgraded to a secure method such as:

- VRF
- commit-reveal
- oracle-backed randomness
- another audited secure selection mechanism
```

---

## 21. Final Build Commands

Use this sequence for a clean final run.

```bash
# Root
npm install
npx hardhat compile
npx hardhat test
npx hardhat node
```

Keep the node running, then in another terminal:

```bash
npx hardhat run scripts/deploy-demo.js
```

Then:

```bash
cd web
npm install
npm run dev
```

Optional reset:

```bash
# stop node
# clear local storage if needed
# redeploy demo
npx hardhat run scripts/deploy-demo.js
```

---

## 22. Hardhat Configuration Reference

Use this minimum configuration.

```js
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
  },
};
```

If using Ethers v6 and Chai, ensure the Hardhat toolbox is installed:

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

---

## 23. Frontend Project Setup Reference

If starting from zero in `web/`:

```bash
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install ethers
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Add Tailwind content paths:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Add Tailwind directives to the main CSS file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 24. Required File Manifest

Before final submission, ensure these files exist.

```text
contracts/PrizeToken.sol
contracts/PrizeDraw.sol
test/PrizeDraw.test.js
scripts/deploy-demo.js
hardhat.config.js
package.json
README.md
web/src/main.tsx
web/src/App.tsx
web/src/components/ConnectWallet.tsx
web/src/components/EventStatusCard.tsx
web/src/components/SponsorPanel.tsx
web/src/components/ParticipantPanel.tsx
web/src/components/DrawControls.tsx
web/src/components/ClaimPanel.tsx
web/src/components/TransparencyPanel.tsx
web/src/lib/wallet.ts
web/src/lib/draw.ts
web/src/lib/constants.ts
web/src/abi/PrizeDraw.json
web/src/abi/PrizeToken.json
web/index.html
web/vite.config.ts
web/tailwind.config.js
web/postcss.config.js
web/package.json
```

If a file is optional and not implemented, remove it from the manifest and do not claim it exists.

---

## 25. Frontend Constants Reference

Create `web/src/lib/constants.ts` with at least:

```ts
export const DEFAULT_RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export const STATUS_LABELS: Record<number, string> = {
  0: "Not Open",
  1: "Open",
  2: "Closed",
  3: "Drawn",
  4: "Settled",
  5: "Cancelled",
};

export const STATUS_COLORS: Record<number, string> = {
  0: "bg-blue-100 text-blue-800",
  1: "bg-green-100 text-green-800",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-purple-100 text-purple-800",
  4: "bg-gray-100 text-gray-800",
  5: "bg-red-100 text-red-800",
};
```

Use environment variables for addresses:

```ts
export const PRIZE_TOKEN_ADDRESS = import.meta.env.VITE_PRIZE_TOKEN_ADDRESS;
export const DRAW_ADDRESS = import.meta.env.VITE_DRAW_ADDRESS;
```

---

## 26. Transparency Panel Implementation Notes

For MVP, assume ticket cap is small enough to display all participants.

Fetch participant list:

```ts
const count = Number(await draw.participantCount());
const participants: string[] = [];
for (let i = 0; i < count; i += 1) {
  const p = await draw.participants(i);
  participants.push(p);
}
```

Display:

```text
Selected Index: 2
Participant Count: 5
Winner: 0x...
```

Participant list:

```text
0: 0xAlice
1: 0xBob
2: 0xCharlie  ← selected
3: 0xDavid
4: 0xEve
```

Verification note:

```md
The winner is derived by reading the on-chain participant list and selecting the participant at `selectedIndex`.
```

---

## 27. Demo Video Structure

Create a short video if possible.

Target length:

- 60 seconds minimum
- 90 seconds ideal
- 120 seconds maximum

### 0:00 – 0:10 — Intro

Show:

- project name
- one-liner
- core value: transparent prize distribution

### 0:10 – 0:25 — Setup

Show:

- deployed prize event
- sponsor funded prize
- status: Open

### 0:25 – 0:45 — Participation

Show:

- participant connects
- participant mints participation ticket
- participant count updates
- ticket ID displayed

### 0:45 – 1:00 — Selection

Show:

- event closed
- execute selection
- winner displayed
- transparency data displayed

### 1:00 – 1:15 — Claim

Show:

- winner connects
- claim prize
- prize token balance updates
- status: Settled

### 1:15 – 1:30 — Closing

Show:

- README scope
- why Monad
- roadmap in one sentence

---

## 28. Judge Q&A Reference

Prepare short answers.

### Q1: What is this project?

Answer:

> MonadDraw is a trustless prize distribution engine for transparent, sponsor-funded community prize events. It uses NFT participation tickets, on-chain state, and automatic prize settlement.

---

### Q2: Is this a paid-entry prize operation?

Answer:

> No. The MVP uses free participation tickets, a sponsor-funded demo token, and local/testnet environments only. There is no paid entry and no operator profit mechanism.

---

### Q3: Why use NFTs?

Answer:

> NFTs provide a unique, on-chain participation record. They make each ticket identifiable, allow participant state to be tracked, and fit naturally into the EVM ecosystem.

---

### Q4: Why Monad?

Answer:

> Prize events can create sudden bursts of participation. Monad’s EVM compatibility and high-throughput execution model make it a good fit for ticket minting, state updates, and settlement.

---

### Q5: How is the selection fair?

Answer:

> The MVP stores the selection seed, selected index, and winner on-chain so the result is inspectable. The MVP selection mechanism is demo-grade. In production, we would use VRF, commit-reveal, oracle-backed randomness, or another secure selection method.

---

### Q6: Can this support real-world assets?

Answer:

> In future versions, yes. The MVP settles an ERC20 demo token. Later, the engine could be extended to support NFTs, multi-asset bundles, tokenized rewards, or attestation-backed real-world rewards, while keeping custody and compliance at the application layer.

---

### Q7: What is the main technical contribution?

Answer:

> The core contribution is a simple, transparent prize event state machine with sponsor-funded escrow, NFT participation, verifiable selection, and automatic settlement.

---

### Q8: What would you build next?

Answer:

> The next steps are secure selection, multi-draw support, eligibility modules, NFT and multi-asset prize support, sponsor dashboards, and a reusable SDK for building prize events.

---

## 29. Final Submission Checklist

Do not submit until every item below is true.

### Repository

- [ ] README exists.
- [ ] README includes disclaimer.
- [ ] README includes demo instructions.
- [ ] README includes contract addresses or placeholder.
- [ ] No real private keys committed.
- [ ] No mainnet deployment instructions presented as default.
- [ ] No paid-entry language in README.

### Contracts

- [ ] `PrizeToken.sol` compiles.
- [ ] `PrizeDraw.sol` compiles.
- [ ] No payable functions in MVP.
- [ ] No paid entry logic.
- [ ] No operator profit logic.
- [ ] Tickets are free to mint.
- [ ] One ticket per participant enforced.
- [ ] Ticket cap enforced.
- [ ] Draw can execute after close.
- [ ] Winner can claim prize.
- [ ] Transparency fields are stored.

### Tests

- [ ] Deployment tests pass.
- [ ] Funding tests pass.
- [ ] Minting tests pass.
- [ ] Selection tests pass.
- [ ] Claim tests pass.
- [ ] Negative tests pass.

### Frontend

- [ ] Frontend starts.
- [ ] Wallet/local account connection works.
- [ ] Event status updates.
- [ ] Sponsor funding is visible or documented.
- [ ] Participant can mint ticket.
- [ ] Duplicate mint is disabled.
- [ ] Selection can be executed.
- [ ] Winner can claim prize.
- [ ] Transparency panel displays verification data.
- [ ] Transaction errors are visible.

### Demo

- [ ] Local node can start.
- [ ] Deploy script works from a fresh terminal.
- [ ] Full demo flow works end-to-end.
- [ ] Demo does not require hidden manual steps.
- [ ] Demo script is prepared.
- [ ] Judge Q&A answers are prepared.

### Scope

- [ ] Project is clearly a testnet/local technical demo.
- [ ] No real funds are accepted.
- [ ] No real-world asset transfer is implemented.
- [ ] No paid entry exists.
- [ ] No operator profit exists.
- [ ] Roadmap is separated from MVP.

---

## 30. Agent Stop Conditions

An AI agent must stop and report if any of the following occur:

1. A requested feature would introduce paid entry.
2. A requested feature would introduce operator profit.
3. A requested feature would require mainnet deployment.
4. A requested feature would require real-world asset custody.
5. Contract compilation fails and cannot be fixed quickly.
6. Core unit tests fail.
7. The deploy script cannot produce a working local demo.
8. The frontend cannot mint, execute selection, or claim prize.
9. Time remaining is less than 30 minutes and the core flow is not working.

If the agent stops, it must provide:

- current status
- failing command
- exact error
- last working state
- recommended 10-minute fix
- fallback demo plan

---

## 31. Fallback Demo Plan

If the full UI is not finished:

Use terminal-only demo.

Required minimum:

1. Show tests passing.
2. Run deploy script.
3. Use Hardhat console or script to:
   - fund draw
   - mint ticket
   - close event
   - execute selection
   - claim prize
4. Show stored state:
   - winner
   - seed
   - selected index
   - token balance
5. Show README and disclaimer.

Fallback script print:

```text
Sponsor funded prize.
Participant minted ticket.
Draw executed.
Winner selected.
Winner claimed prize.
Status: Settled
```

This is acceptable only if the frontend cannot be completed, but the smart-contract flow must still work.

---

## 32. Final Project Positioning

Use this final positioning everywhere.

### Project Name

**MonadDraw**

### Category

- EVM-compatible protocol
- High-throughput L1 demo
- Transparent prize distribution
- NFT-based participation
- Automatic on-chain settlement

### One-liner

> A trustless, EVM-compatible prize distribution engine for transparent, sponsor-funded community prize events using NFT participation tickets and automatic on-chain settlement.

### Core Value

- Transparency
- Verifiability
- Simplicity
- EVM compatibility
- Fit for high-throughput networks

### MVP Proof

- Sponsor funds prize
- Participant mints free NFT ticket
- Selection executes transparently
- Winner claims prize automatically
- State remains inspectable on-chain

### Why It Wins

- Clear problem
- Simple demo
- Strong Monad fit
- Working end-to-end flow
- Safe scope
- Good future roadmap
- Easy to understand for judges

---

## 33. Final Agent Instruction

When building this project:

- Prioritize a working end-to-end MVP.
- Keep the scope narrow.
- Keep the language safe and technical.
- Do not add paid entry.
- Do not add operator profit.
- Do not add real-world asset transfer.
- Do not deploy to mainnet.
- Do not overbuild.
- If in doubt, choose the simpler demo-grade solution and document the production upgrade path.

The successful outcome is a small, clean, verifiable prize distribution demo that runs reliably in under 10 minutes for a judge.