//import expectThrow from './helpers/expectThrow';

const TokenContract = artifacts.require('Token');
const PackageContract = artifacts.require('Package');

contract('Package expected flow', (accounts) => {
    let debtTokenOne;
    let debtTokenTwo;
    let debtTokenThree;
    let debtTokenFour;
    let liquidityToken;
    let debtPackage;

    let purchaser = accounts[0];

    let maxRisk = 15;
    let maxFundPercentage = 30;
    let total = 1000;
    let fundingPeriod = 30;
    let auctionPeriod = 60;
    let auctionFloorPricePercentage = 70;
    let riskOracle = accounts[8];

    before(async () => {
        debtTokenOne = await TokenContract.new(accounts[1], 1000);
        debtTokenTwo = await TokenContract.new(accounts[2], 1000);
        debtTokenThree = await TokenContract.new(accounts[3], 1000);
        debtTokenFour = await TokenContract.new(accounts[4], 1000);
        liquidityToken = await TokenContract.new(purchaser, 1200);

        debtPackage = await PackageContract.new(
            maxRisk,
            maxFundPercentage,
            total,
            fundingPeriod,
            auctionPeriod,
            auctionFloorPricePercentage,
            liquidityToken.address,
            riskOracle
        );
    })

    it('should set start values properly', async () => {
        let _maxRisk = await debtPackage.maxRisk();
        assert.equal(_maxRisk.valueOf(), maxRisk, 'should be 15');

        let maxFund = (total * maxFundPercentage) / 100;
        let _maxFund = await debtPackage.maxFund();
        assert.equal(_maxFund.valueOf(), maxFund, 'should be 500');

        let _total = await debtPackage.total();
        assert.equal(_total.valueOf(), total, 'should be 1000');
        
        let minutes = 60;
        fundingPeriod = fundingPeriod * minutes;
        let _fundingPeriod = await debtPackage.fundingPeriod();
        assert.equal(_fundingPeriod.valueOf(), fundingPeriod, 'should be 1800');

        auctionPeriod = auctionPeriod * minutes;
        let _auctionPeriod = await debtPackage.auctionPeriod();
        assert.equal(_auctionPeriod.valueOf(), auctionPeriod, 'should be 3600');

        let auctionFloorPrice = (total * auctionFloorPricePercentage) / 100;
        let _auctionFloorPrice = await debtPackage.auctionFloorPrice();
        assert.equal(_auctionFloorPrice.valueOf(), auctionFloorPrice, 'should be 700');

        let _liquidityToken = await debtPackage.liquidityToken();
        assert.equal(_liquidityToken, liquidityToken.address, 'should be same');

        let _riskOracle = await debtPackage.riskOracle();
        assert.equal(_riskOracle, riskOracle, 'should be same than accounts[8]');
    });

    it('should fund the package properly', async() => {
        let amount = 300;
        
        await debtTokenOne.increaseAllowance(debtPackage.address, amount, { from: accounts[1] });
        await debtPackage.fund(accounts[1], debtTokenOne.address, amount);
        
        let balance = await debtPackage.tokenBalance();
        assert.equal(balance, amount, 'should be 300');
    });

    it('should be completely funded the package, and the same time start the auction', async() => {
        await debtTokenOne.increaseAllowance(debtPackage.address, 83, { from: accounts[1] });
        await debtPackage.fund(accounts[1], debtTokenOne.address, 83);

        await debtTokenTwo.increaseAllowance(debtPackage.address, 800, { from: accounts[2] });
        await debtPackage.fund(accounts[2], debtTokenTwo.address, 800);

        await debtTokenThree.increaseAllowance(debtPackage.address, 300, { from: accounts[3] });
        await debtPackage.fund(accounts[3], debtTokenThree.address, 300);

        await debtTokenFour.increaseAllowance(debtPackage.address, 350, { from: accounts[4] });
        await debtPackage.fund(accounts[4], debtTokenFour.address, 350);

        let balance = await debtPackage.tokenBalance();
        assert.equal(balance.valueOf(), total, 'should be 1000');

        let fundingTimeFinished = await debtPackage.fundingTimeFinished();
        assert.isAbove(Number(fundingTimeFinished.valueOf()), 0, 'grather than 0');
    });

    it('should be sold the package in the auction', async() => {
        await liquidityToken.increaseAllowance(debtPackage.address, 1000, { from: purchaser });
        await debtPackage.auction(purchaser);

        let owner = await debtPackage.owner();
        assert.equal(owner, purchaser, 'should be accounts[0]');

        let auctionTimeFinished = await debtPackage.auctionTimeFinished();
        assert.isAbove(Number(auctionTimeFinished.valueOf()), 0, 'grather than 0');
    });

    it('should get liquidity properly', async() => {
        let contribution = await debtPackage.contributions(accounts[1], debtTokenOne.address);
        contribution = Number(contribution.valueOf());

        await debtPackage.cashOut(debtTokenOne.address, { from: accounts[1] });

        let liquidityBalance = await liquidityToken.balanceOf(debtPackage.address);
        liquidityBalance = Number(liquidityBalance.valueOf());
        
        assert.equal(liquidityBalance, (total - contribution), 'should be 617');
    });

    it('should be collected properly the debt tokens bt the owner', async() => {
        let amount = await debtPackage.tokens(debtTokenTwo.address);

        await debtPackage.collectToken(debtTokenTwo.address, { from: purchaser });

        amount = Number(amount.valueOf());
        
        let currentAmount = await debtTokenTwo.balanceOf(purchaser);

        currentAmount = Number(currentAmount.valueOf());
            
        assert.equal(amount, currentAmount, 'should be the same; 474')
    });

});
