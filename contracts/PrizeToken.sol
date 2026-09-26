// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Demo prize token for MonadDraw testnet demo. Not a real-value asset.
contract PrizeToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Demo Prize", "DPRZ") {
        _mint(msg.sender, initialSupply);
    }
}
