# Analysis result for Token.sol

## Integer Overflow
- SWC ID: 101
- Severity: High
- Contract: Token
- Function name: increaseAllowance(address,uint256)
- PC address: 1517
- Estimated Gas Usage: 942 - 2407

### Description
The binary addition can overflow.
The operands of the addition operation are not sufficiently constrained. The addition could therefore result in an integer overflow. Prevent the overflow by checking inputs or ensure sure that the overflow is caught by an assertion.

In file: Token.sol:17

# Analysis result for SafeMath.sol

No issues found.

# Analysis result for ERC20.sol

## Integer Overflow
- SWC ID: 101
- Severity: High
- Contract: ERC20
- Function name: increaseAllowance(address,uint256)
- PC address: 1517
- Estimated Gas Usage: 942 - 2407

### Description
The binary addition can overflow.
The operands of the addition operation are not sufficiently constrained. The addition could therefore result in an integer overflow. Prevent the overflow by checking inputs or ensure sure that the overflow is caught by an assertion.

In file: ERC20.sol:46

### Code
```solidity
function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
    require(spender != address(0));
    _allowed[msg.sender][spender] = _allowed[msg.sender][spender].add(addedValue);
    emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
    return true;
}
```

# Analysis result for Package

No issues found.
