// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Transparent prize distribution engine. Testnet demo only, no paid entry.
/// @dev Draw randomness is demo-grade (blockhash/timestamp based), not production-secure.
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

    event PrizeFunded(address indexed funder, uint256 amount, uint256 totalFunded);

    event TicketMinted(address indexed participant, uint256 indexed tokenId, uint256 ticketCount);

    event DrawExecuted(
        address indexed winner,
        bytes32 seed,
        uint256 selectedIndex,
        uint256 participantCount
    );

    event PrizeClaimed(address indexed winner, uint256 amount);

    event DrawCancelled(address indexed sponsor, uint256 refundAmount);

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

        emit DrawCreated(address(this), sponsor, _prizeToken, _prizeAmount, _ticketCap, openAt, closeAt);
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

    function safeTransferFrom(address, address, uint256, bytes memory) public override {
        revert("ticket transfers disabled");
    }

    function transferFrom(address, address, uint256) public override {
        revert("ticket transfers disabled");
    }

    function approve(address, uint256) public override {
        revert("ticket approvals disabled");
    }

    function setApprovalForAll(address, bool) public override {
        revert("ticket approvals disabled");
    }
}
