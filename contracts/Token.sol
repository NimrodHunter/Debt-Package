pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


/**
 * @title Token.
 * @notice Simple token following the ERC20 standard.
 * @author Anibal Catalán <anibalcatalanf@gmail.com>.
 */
contract Token is ERC20 {
    constructor(address to, uint256 amount) public {
        require(amount > 0, "invalid amount");
        _mint(to, amount);
    }
}
