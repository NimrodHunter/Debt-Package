pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


/**
 * @title Debts Package.
 * @notice Package of debts tokens to be sold on a time auction.  
 * @author Anibal Catalán <anibalcatalanf@gmail.com>.
 */
contract Package {
    using SafeMath for uint256;

    uint256 public maxRisk;
    uint256 public maxFund;
    uint256 public total;
    uint256 public fundingPeriod;
    uint256 public auctionPeriod;
    uint256 public auctionFloorPrice;

    uint256 public startTime;
    uint256 public fundingTimeFinished;
    uint256 public auctionTimeFinished;
    uint256 public tokenBalance;
    uint256 public finalPrice;
    address public liquidityToken;
    address public owner;
    address public riskOracle;

    mapping(address => uint256) public tokenAmount; //token->amount
    mapping(address => mapping(address => uint256)) public tokenContributions; //contributor->token->amount

    event LogFunded(address contributor, address token, uint256 contribution, uint256 balance);
    event LogPackageFunded();
    event LogPackageSold(address owner, uint256 finalPrice);
    event LogCashOut(address contributor, address token, uint256 liquidity);
    event LogDebtRetrieved(address contributor, address token, uint256 contribution);
    event LogTokenCollected(address token, uint256 amount);

    constructor(
        uint256 _maxRisk,
        uint256 _maxFundPercentage,
        uint256 _total,
        uint256 _fundingPeriod,
        uint256 _auctionPeriod,
        uint256 _auctionFloorPricePercentage,
        address _liquidityToken,
        address _riskOracle
    ) public {
        require(_maxRisk > 0 && _maxRisk <= 100, "risk aout of range");
        require(_maxFundPercentage > 0 && _maxFundPercentage <= 100, "max fund per token aut of range");
        require(_fundingPeriod > 0, "invalid funding period");
        require(_auctionPeriod > 0, "invalid auction period");
        require(_auctionFloorPricePercentage > 0 && _auctionFloorPricePercentage <= 100, "auction floor price aout of range");
        require(_liquidityToken != address(0), "invalid controller address");
        require(_riskOracle != address(0), "invalid risk oracle address");

        maxRisk = _maxRisk;
        maxFund = _total * _maxFundPercentage / 100;
        total = _total;
        fundingPeriod = _fundingPeriod * 1 minutes;
        auctionPeriod = _auctionPeriod * 1 minutes;
        auctionFloorPrice = _total * _auctionFloorPricePercentage / 100;
        
        startTime = now;
        liquidityToken = _liquidityToken;
        riskOracle = _riskOracle;
    }
    
    /** 
     * @notice Function controlling by the company, 
     *         when the company see that this contract was funded with debt tokens,
     *         they call this function to change the state according.
     * @param contributor Is who sent the debt token to this contract. 
     * @param token It is the debt token.
     * @param contribution It how much token was send.
     */
    function fund(address contributor, address token, uint256 contribution) public {
        require(tokenBalance < total, "package totally funded"); // validate balance
        require(now <= startTime.add(fundingPeriod) && fundingTimeFinished == 0, "out of period"); //validate funding time
        //TODO: Validate risk with an external risk Oracle
        require(
            contribution >= IERC20(token).allowance(contributor, address(this)),
            "not enough amount of tokens are allowed"
        ); // validate if amount of contribution is allowed

        uint256 contributionAmount;

        if (tokenAmount[token].add(contribution) > maxFund && tokenBalance.add(contribution) > total) {
            if (tokenBalance.add(contribution).sub(total) > tokenAmount[token].add(contribution).sub(maxFund)) {
                contributionAmount = total.sub(tokenBalance);
            } else {
                contributionAmount = maxFund.sub(tokenAmount[token]);
            }
        } else if (tokenBalance.add(contribution) > total) {
            contributionAmount = total.sub(tokenBalance);
        } else if (tokenAmount[token].add(contribution) > maxFund) {
            contributionAmount = maxFund.sub(tokenAmount[token]);
        } else {
            contributionAmount = contribution;
        }

        tokenAmount[token] = tokenAmount[token].add(contributionAmount);
        tokenContributions[contributor][token] = tokenContributions[contributor][token].add(contributionAmount);
        tokenBalance = tokenBalance.add(contributionAmount);

        if (tokenBalance == total) {
            fundingTimeFinished = now;
            emit LogPackageFunded();
        }

        require(IERC20(token).transferFrom(contributor, address(this), contributionAmount), "transfer from fail");

        emit LogFunded(contributor, token, contributionAmount, tokenBalance);
    }

    /**
     * @notice Time auction, the price of the package will decrease linearly,
     *         until reach the floor auction price at the end of the auction period.
     * @param purchaser Who purchased the package.
     */
    function auction(address purchaser) public {
        finalPrice = packagePrice();
        
        uint256 amount = IERC20(liquidityToken).allowance(purchaser, address(this));
        
        require(amount >= finalPrice, "not enough liquidity token is allowed");
        
        owner = purchaser;
        auctionTimeFinished = now;

        require(IERC20(liquidityToken).transferFrom(purchaser, address(this), finalPrice), "transfer from fail");

        emit LogPackageSold(owner, finalPrice);
    }
    
    /**
     * @notice Contributors can get liquidity as result of selling their debt tokens,
     *         this is proportional to the final package price and the debt token contribution.
     * @param token Helps to identify the debt token contribution.
     */
    function cashOut(address token) public {
        require(auctionTimeFinished > 0, "auction is not successfully finished");

        uint256 contribution = tokenContributions[msg.sender][token];
        
        require(contribution > 0, "no contributions");

        tokenContributions[msg.sender][token] = 0;
        tokenAmount[token] = tokenAmount[token].sub(contribution);
        
        uint256 liquidity = contribution.mul(finalPrice).div(total);

        require(IERC20(liquidityToken).transfer(msg.sender, liquidity), "fail liquidity transfer");

        emit LogCashOut(msg.sender, token, liquidity);
    }

    /**
     * @notice Contributors can retrieve their debt tokens if the funding of the package it was not successful.
     * @param token Helps to identify the debt token contribution.
     */
    function retrieveDebt(address token) public {
        require((now > startTime.add(fundingPeriod) && fundingTimeFinished == 0) ||
                (fundingTimeFinished > 0 && now > fundingTimeFinished.add(auctionPeriod) && auctionTimeFinished == 0),
        "funding or auction running");
        
        uint256 contribution = tokenContributions[msg.sender][token];

        require(contribution > 0, "no contributions");

        tokenContributions[msg.sender][token] = 0;
        tokenAmount[token] = tokenAmount[token].sub(contribution);
        tokenBalance = tokenBalance.sub(contribution);

        require(IERC20(token).transfer(msg.sender, contribution), "token transfer fail");
        emit LogDebtRetrieved(msg.sender, token, contribution);
    }
    
    /**
     * @notice Package owner can collect the debt tokens.
     * @param token Helps to identify the debt token to be collect.
     */
    function collectToken(address token) public {
        require(auctionTimeFinished > 0, "auction is not successfully finished");
        require(msg.sender == owner, "caller is not the owner");

        uint256 amount = IERC20(token).balanceOf(address(this));

        tokenAmount[token] = 0;
        tokenBalance = tokenBalance.sub(amount);

        require(IERC20(token).transfer(owner, amount), "token transfer fail");
        emit LogTokenCollected(token, amount);
    }

    /**
     * @notice Calculate the package price while the auction is running.
     * @return price Package price in Wei.
     */
    function packagePrice() public view returns(uint256) {
        require(fundingTimeFinished > 0, "funding is not complete");
        require(now <= fundingTimeFinished.add(auctionPeriod) && auctionTimeFinished == 0, "out of period");
        
        uint256 linearPriceChange = total.sub(auctionFloorPrice).mul(now.sub(fundingTimeFinished)).div(auctionPeriod);
        return total.sub(linearPriceChange);
    }

    /**
     * @notice Get the amount of tokens contributed by a contributor.
     * @param contributor where the contribution came from.
     * @param token it is the token contributed.
     * @return amount of tokens contributed.
     */
    function contributions(address contributor, address token) public view returns(uint256) {
        return tokenContributions[contributor][token];
    }

    /**
     * @notice Get the amount of tokens contributed.
     * @param token it is the token contributed.
     * @return amount of tokens contributed.
     */
    function tokens(address token) public view returns(uint256) {
        return tokenAmount[token];
    }
}
