# Analysis result for Token:

==== Integer Overflow ====
SWC ID: 101
Severity: High
Contract: Token
Function name: increaseAllowance(address,uint256)
PC address: 1517
Estimated Gas Usage: 942 - 2407
The binary addition can overflow.
The operands of the addition operation are not sufficiently constrained. The addition could therefore result in an integer overflow. Prevent the overflow by checking inputs or ensure sure that the overflow is caught by an assertion.
--------------------
In file: Token.sol:17


# Analysis result for SafeMath

No issues found.
# Analysis result for ERC20:

==== Integer Overflow ====
SWC ID: 101
Severity: High
Contract: ERC20
Function name: increaseAllowance(address,uint256)
PC address: 1517
Estimated Gas Usage: 942 - 2407
The binary addition can overflow.
The operands of the addition operation are not sufficiently constrained. The addition could therefore result in an integer overflow. Prevent the overflow by checking inputs or ensure sure that the overflow is caught by an assertion.
--------------------
In file: ERC20.sol:46

ddres

--------------------


# Analysis result for Package

No issues found.
