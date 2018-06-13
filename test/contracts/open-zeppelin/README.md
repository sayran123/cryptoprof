# OpenZeppelin ERC20 token implementation

These solidity files were downloaded from https://github.com/OpenZeppelin/openzeppelin-solidity at commit
[e3f866c98241c2ceffd5dc373aebf6b1dce57cc4](https://github.com/OpenZeppelin/openzeppelin-solidity/commit/e3f866c98241c2ceffd5dc373aebf6b1dce57cc4)

+ [StandardToken.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/e3f866c98241c2ceffd5dc373aebf6b1dce57cc4/contracts/token/ERC20/StandardToken.test.js)

+ [BasicToken.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/e3f866c98241c2ceffd5dc373aebf6b1dce57cc4/contracts/token/ERC20/BasicToken.sol) (modified to import `SafeMath.sol` from current directory)

+ [ERC20.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/e3f866c98241c2ceffd5dc373aebf6b1dce57cc4/contracts/token/ERC20/ERC20.sol)

+ [ERC20Basic.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/e3f866c98241c2ceffd5dc373aebf6b1dce57cc4/contracts/token/ERC20/ERC20Basic.sol)

+ [SafeMath.sol](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/e3f866c98241c2ceffd5dc373aebf6b1dce57cc4/contracts/math/SafeMath.sol)

- - -

[test.sol](./test.sol) contains a `Test` contract which can be used to profile the OpenZeppelin
`StandardToken` implementation.