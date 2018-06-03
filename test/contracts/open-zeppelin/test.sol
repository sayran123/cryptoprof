pragma solidity ^0.4.23;

import "./StandardToken.sol";

contract Test is StandardToken {
    constructor(uint256 initialAmount) public {
        totalSupply_ = initialAmount;
        balances[msg.sender] = initialAmount;
    }
}
