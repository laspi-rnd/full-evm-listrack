// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

// import "./utils/console.sol";
import "./tokens/ERC20.sol";

contract AlienToken is ERC20 {

    constructor () ERC20("AlienToken", "Alien_TKN") {
        _mint(_msgSender(), 1000000 * (10 ** uint256(decimals())));
        console.log ("@@@ Alien Token deployed with number of Tokens equal to :",
                1000000 * (10 ** uint256(decimals())) );
    }
}