// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(
        string memory tokenName,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(tokenName, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
