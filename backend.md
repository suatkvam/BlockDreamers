## 9. Smart Contract Specification

### 9.1 Contracts to Build

#### 9.1.1 PrizeToken

A simple demo ERC20 token.

Purpose:

- Provide the prize asset for the demo.
- Avoid requiring an external token.

#### 9.1.2 PrizeDraw

The core prize event contract.

Purpose:

- Escrow prize tokens
- Mint ERC721 participation tickets
- Track participants
- Execute transparent selection
- Allow winner claim

### 9.2 PrizeToken Specification

```solidity
contract PrizeToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Demo Prize", "DPRZ") {
        _mint(msg.sender, initialSupply);
    }
}
```

Requirements:

- Name: `Demo Prize`
- Symbol: `DPRZ`
- Decimals: default 18
- Initial supply minted to deployer

### 9.3 PrizeDraw Specification

#### 9.3.1 Inheritance

```solidity
contract PrizeDraw is ERC721
```

Use OpenZeppelin ERC721.

Constructor:

```solidity
constructor(
    address _prizeToken,
    uint256 _prizeAmount,
    uint256 _ticketCap,
    uint64 _duration
) ERC721("Prize Ticket", "PRZT")
```

Validation:

- `_prizeToken` must not be `address(0)`
- `_prizeAmount` must be greater than 0
- `_ticketCap` must be greater than 0
- `_duration` must be greater than 0

Set:

- `sponsor = msg.sender`
- `openAt = block.timestamp`
- `closeAt = openAt + _duration`

#### 9.3.2 Core State

```solidity
address public sponsor;
IERC20 public prizeToken;
uint256 public prizeAmount;
uint256 public ticketCap;

uint64 public openAt;
uint64 public closeAt;
uint64 public drawnAt;
uint64 public settledAt;

bool public cancelled;

uint256 public fundedAmount;

address public winner;
bytes32 public drawSeed;
uint256 public selectedIndex;

address[] public participants;
mapping(address => bool) public isParticipant;
mapping(address => uint256) public participantTicketId;
```

#### 9.3.3 Status Enum

```solidity
enum Status {
    NotOpen,
    Open,
    Closed,
    Drawn,
    Settled,
    Cancelled
}
```

Status logic:

```solidity
function status() public view returns (Status) {
    if (cancelled) return Status.Cancelled;
    if (settledAt != 0) return Status.Settled;
    if (drawnAt != 0) return Status.Drawn;

    if (block.timestamp < closeAt) {
        if (block.timestamp >= openAt && fundedAmount >= prizeAmount) {
            return Status.Open;
        }
        return Status.NotOpen;
    }

    return Status.Closed;
}
```

#### 9.3.4 Sponsor Funding

```solidity
function fundDraw(uint256 amount) external onlySponsor notCancelled {
    if (fundedAmount + amount > prizeAmount) revert FundingExceedsPrize();
    if (amount == 0) revert InvalidAmount();

    prizeToken.transferFrom(msg.sender, address(this), amount);
    fundedAmount += amount;

    emit PrizeFunded(msg.sender, amount, fundedAmount);
}
```

Requirements:

- Only sponsor can fund.
- Funding can happen in multiple transactions.
- Total funding cannot exceed `prizeAmount`.
- Event must be fully funded before ticket minting.

#### 9.3.5 Ticket Minting

```solidity
function mintTicket() external notCancelled {
    if (status() != Status.Open) revert DrawNotOpen();
    if (isParticipant[msg.sender]) revert AlreadyParticipant();
    if (participants.length >= ticketCap) revert TicketCapReached();

    uint256 tokenId = participants.length;
    participantTicketId[msg.sender] = tokenId;

    _safeMint(msg.sender, tokenId);

    isParticipant[msg.sender] = true;
    participants.push(msg.sender);

    emit TicketMinted(msg.sender, tokenId, participants.length);
}
```

Requirements:

- No payment.
- One ticket per address.
- Token ID equals participant index.
- Stop at ticket cap.
- Stop after close.
- Stop if not funded.

#### 9.3.6 Draw Execution

```solidity
function executeDraw() external notCancelled {
    if (status() != Status.Closed) revert DrawNotClosed();
    if (participants.length == 0) revert NoParticipants();

    drawSeed = keccak256(
        abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp,
            msg.sender,
            block.number,
            address(this)
        )
    );

    selectedIndex = uint256(drawSeed) % participants.length;
    winner = participants[selectedIndex];
    drawnAt = uint64(block.timestamp);

    emit DrawExecuted(winner, drawSeed, selectedIndex, participants.length);
}
```

Requirements:

- Can be called by anyone after close.
- Must store seed and index.
- Must be verifiable from public state.
- Must revert if no participants.

Randomness note:

- MVP randomness is **demo-grade**.
- It is not a production security mechanism.
- Production should use VRF, commit-reveal, oracle-backed randomness, or another approved secure method.
- The UI and README must clearly state this.

#### 9.3.7 Prize Claim

```solidity
function claimPrize() external notCancelled {
    if (status() != Status.Drawn) revert DrawNotDrawn();
    if (msg.sender != winner) revert NotWinner();

    settledAt = uint64(block.timestamp);
    prizeToken.transfer(msg.sender, prizeAmount);

    emit PrizeClaimed(msg.sender, prizeAmount);
}
```

#### 9.3.8 Sponsor Cancel

Optional but recommended.

```solidity
function sponsorCancelDraw() external onlySponsor {
    if (cancelled) revert DrawAlreadyCancelled();
    if (block.timestamp >= closeAt) revert DrawAlreadyCancelled();
    if (participants.length != 0) revert CannotCancelAfterParticipants();

    cancelled = true;
    uint256 refund = fundedAmount;

    if (refund > 0) {
        prizeToken.transfer(msg.sender, refund);
        fundedAmount = 0;
    }

    emit DrawCancelled(msg.sender, refund);
}
```

#### 9.3.9 Sponsor Forfeit

Optional but recommended.

If the event closes with no participants, allow sponsor to withdraw the prize.

```solidity
function sponsorForfeitPrize() external onlySponsor {
    if (cancelled) revert DrawAlreadyCancelled();
    if (block.timestamp < closeAt) revert DrawNotClosed();
    if (participants.length != 0) revert CannotCancelAfterParticipants();

    cancelled = true;
    uint256 refund = fundedAmount;

    if (refund > 0) {
        prizeToken.transfer(msg.sender, refund);
        fundedAmount = 0;
    }

    emit DrawCancelled(msg.sender, refund);
}
```

### 9.4 Events

```solidity
event DrawCreated(
    address indexed draw,
    address indexed sponsor,
    address prizeToken,
    uint256 prizeAmount,
    uint256 ticketCap,
    uint64 openAt,
    uint64 closeAt
);

event PrizeFunded(
    address indexed funder,
    uint256 amount,
    uint256 totalFunded
);

event TicketMinted(
    address indexed participant,
    uint256 indexed tokenId,
    uint256 ticketCount
);

event DrawExecuted(
    address indexed winner,
    bytes32 seed,
    uint256 selectedIndex,
    uint256 participantCount
);

event PrizeClaimed(
    address indexed winner,
    uint256 amount
);

event DrawCancelled(
    address indexed sponsor,
    uint256 refundAmount
);
```

### 9.5 Custom Errors

```solidity
error NotSponsor();
error DrawNotOpen();
error DrawNotClosed();
error DrawNotDrawn();
error AlreadyParticipant();
error TicketCapReached();
error NoParticipants();
error NotWinner();
error AlreadyFunded();
error FundingExceedsPrize();
error CannotCancelAfterParticipants();
error DrawAlreadyCancelled();
error InvalidDuration();
error InvalidCap();
error InvalidToken();
error InvalidAmount();
```

### 9.6 Reference Implementation

Use this as the primary implementation reference.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PrizeDraw is ERC721 {
    enum Status {
        NotOpen,
        Open,
        Closed,
        Drawn,
        Settled,
        Cancelled
    }

    address public sponsor;
    IERC20 public prizeToken;
    uint256 public prizeAmount;
    uint256 public ticketCap;

    uint64 public openAt;
    uint64 public closeAt;
    uint64 public drawnAt;
    uint64 public settledAt;

    bool public cancelled;

    uint256 public fundedAmount;

    address public winner;
    bytes32 public drawSeed;
    uint256 public selectedIndex;

    address[] public participants;
    mapping(address => bool) public isParticipant;
    mapping(address => uint256) public participantTicketId;

    event DrawCreated(
        address indexed draw,
        address indexed sponsor,
        address prizeToken,
        uint256 prizeAmount,
        uint256 ticketCap,
        uint64 openAt,
        uint64 closeAt
    );

    event PrizeFunded(
        address indexed funder,
        uint256 amount,
        uint256 totalFunded
    );

    event TicketMinted(
        address indexed participant,
        uint256 indexed tokenId,
        uint256 ticketCount
    );

    event DrawExecuted(
        address indexed winner,
        bytes32 seed,
        uint256 selectedIndex,
        uint256 participantCount
    );

    event PrizeClaimed(
        address indexed winner,
        uint256 amount
    );

    event DrawCancelled(
        address indexed sponsor,
        uint256 refundAmount
    );

    error NotSponsor();
    error DrawNotOpen();
    error DrawNotClosed();
    error DrawNotDrawn();
    error AlreadyParticipant();
    error TicketCapReached();
    error NoParticipants();
    error NotWinner();
    error FundingExceedsPrize();
    error CannotCancelAfterParticipants();
    error DrawAlreadyCancelled();
    error InvalidDuration();
    error InvalidCap();
    error InvalidToken();
    error InvalidAmount();

    modifier onlySponsor() {
        if (msg.sender != sponsor) revert NotSponsor();
        _;
    }

    modifier notCancelled() {
        if (cancelled) revert DrawAlreadyCancelled();
        _;
    }

    constructor(
        address _prizeToken,
        uint256 _prizeAmount,
        uint256 _ticketCap,
        uint64 _duration
    ) ERC721("Prize Ticket", "PRZT") {
        if (_prizeToken == address(0)) revert InvalidToken();
        if (_prizeAmount == 0) revert InvalidAmount();
        if (_ticketCap == 0) revert InvalidCap();
        if (_duration == 0) revert InvalidDuration();

        sponsor = msg.sender;
        prizeToken = IERC20(_prizeToken);
        prizeAmount = _prizeAmount;
        ticketCap = _ticketCap;
        openAt = uint64(block.timestamp);
        closeAt = openAt + _duration;

        emit DrawCreated(
            address(this),
            sponsor,
            _prizeToken,
            _prizeAmount,
            _ticketCap,
            openAt,
            closeAt
        );
    }

    function status() public view returns (Status) {
        if (cancelled) return Status.Cancelled;
        if (settledAt != 0) return Status.Settled;
        if (drawnAt != 0) return Status.Drawn;

        if (block.timestamp < closeAt) {
            if (block.timestamp >= openAt && fundedAmount >= prizeAmount) {
                return Status.Open;
            }
            return Status.NotOpen;
        }

        return Status.Closed;
    }

    function participantCount() public view returns (uint256) {
        return participants.length;
    }

    function fundDraw(uint256 amount) external onlySponsor notCancelled {
        if (amount == 0) revert InvalidAmount();
        if (fundedAmount + amount > prizeAmount) revert FundingExceedsPrize();

        prizeToken.transferFrom(msg.sender, address(this), amount);
        fundedAmount += amount;

        emit PrizeFunded(msg.sender, amount, fundedAmount);
    }

    function mintTicket() external notCancelled {
        if (status() != Status.Open) revert DrawNotOpen();
        if (isParticipant[msg.sender]) revert AlreadyParticipant();
        if (participants.length >= ticketCap) revert TicketCapReached();

        uint256 tokenId = participants.length;
        participantTicketId[msg.sender] = tokenId;

        _safeMint(msg.sender, tokenId);

        isParticipant[msg.sender] = true;
        participants.push(msg.sender);

        emit TicketMinted(msg.sender, tokenId, participants.length);
    }

    function executeDraw() external notCancelled {
        if (status() != Status.Closed) revert DrawNotClosed();
        if (participants.length == 0) revert NoParticipants();

        drawSeed = keccak256(
            abi.encodePacked(
                blockhash(block.number - 1),
                block.timestamp,
                msg.sender,
                block.number,
                address(this)
            )
        );

        selectedIndex = uint256(drawSeed) % participants.length;
        winner = participants[selectedIndex];
        drawnAt = uint64(block.timestamp);

        emit DrawExecuted(winner, drawSeed, selectedIndex, participants.length);
    }

    function claimPrize() external notCancelled {
        if (status() != Status.Drawn) revert DrawNotDrawn();
        if (msg.sender != winner) revert NotWinner();

        settledAt = uint64(block.timestamp);
        prizeToken.transfer(msg.sender, prizeAmount);

        emit PrizeClaimed(msg.sender, prizeAmount);
    }

    function sponsorCancelDraw() external onlySponsor {
        if (cancelled) revert DrawAlreadyCancelled();
        if (block.timestamp >= closeAt) revert DrawAlreadyCancelled();
        if (participants.length != 0) revert CannotCancelAfterParticipants();

        cancelled = true;
        uint256 refund = fundedAmount;

        if (refund > 0) {
            prizeToken.transfer(msg.sender, refund);
            fundedAmount = 0;
        }

        emit DrawCancelled(msg.sender, refund);
    }

    function sponsorForfeitPrize() external onlySponsor {
        if (cancelled) revert DrawAlreadyCancelled();
        if (block.timestamp < closeAt) revert DrawNotClosed();
        if (participants.length != 0) revert CannotCancelAfterParticipants();

        cancelled = true;
        uint256 refund = fundedAmount;

        if (refund > 0) {
            prizeToken.transfer(msg.sender, refund);
            fundedAmount = 0;
        }

        emit DrawCancelled(msg.sender, refund);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        revert("ticket transfers disabled");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) public override {
        revert("ticket transfers disabled");
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        revert("ticket transfers disabled");
    }

    function approve(
        address to,
        uint256 tokenId
    ) public override {
        revert("ticket approvals disabled");
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public override {
        revert("ticket approvals disabled");
    }
}
```

### 9.7 Frontend ABI Subset

The frontend only needs a minimal ABI.

#### PrizeToken

```json
[
  {
    "type": "function",
    "name": "approve",
    "stateMutability": "nonpayable",
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "bool"}
    ]
  },
  {
    "type": "function",
    "name": "balanceOf",
    "stateMutability": "view",
    "inputs": [
      {"name": "account", "type": "address"}
    ],
    "outputs": [
      {"name": "", "type": "uint256"}
    ]
  }
]
```

#### PrizeDraw

```json
[
  {
    "type": "function",
    "name": "status",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint8"}
    ]
  },
  {
    "type": "function",
    "name": "prizeToken",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "address"}
    ]
  },
  {
    "type": "function",
    "name": "prizeAmount",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ]
  },
  {
    "type": "function",
    "name": "fundedAmount",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ]
  },
  {
    "type": "function",
    "name": "ticketCap",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ]
  },
  {
    "type": "function",
    "name": "closeAt",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint64"}
    ]
  },
  {
    "type": "function",
    "name": "participantCount",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ]
  },
  {
    "type": "function",
    "name": "isParticipant",
    "stateMutability": "view",
    "inputs": [
      {"name": "account", "type": "address"}
    ],
    "outputs": [
      {"name": "", "type": "bool"}
    ]
  },
  {
    "type": "function",
    "name": "winner",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "address"}
    ]
  },
  {
    "type": "function",
    "name": "drawSeed",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "bytes32"}
    ]
  },
  {
    "type": "function",
    "name": "selectedIndex",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256"}
    ]
  },
  {
    "type": "function",
    "name": "fundDraw",
    "stateMutability": "nonpayable",
    "inputs": [
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "mintTicket",
    "stateMutability": "nonpayable",
    "inputs": [],
    "outputs": []
  },
  {
    "type": "function",
    "name": "executeDraw",
    "stateMutability": "nonpayable",
    "inputs": [],
    "outputs": []
  },
  {
    "type": "function",
    "name": "claimPrize",
    "stateMutability": "nonpayable",
    "inputs": [],
    "outputs": []
  }
]
```

---
