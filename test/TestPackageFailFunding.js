import increaseTime, { duration } from './helpers/increaseTime';

const TokenContract = artifacts.require('Token');
const PackageContract = artifacts.require('Package');

contract('Package fail funding', (accounts) => {
    let debtTokenOne;
    let debtTokenTwo;
    let debtTokenThree;
    let debtTokenFour;
    let liquidityToken;
    let debtPackage;

    let purchaser = accounts[0];

    let maxRisk = 15;
    let maxFundPercentage = 40;
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

    it('should not be completely funded the package, then let the time past forward to fail the funding stage', async() => {
        await debtTokenOne.increaseAllowance(debtPackage.address, 600, { from: accounts[1] });
        await debtPackage.fund(accounts[1], debtTokenOne.address, 600);

        await debtTokenTwo.increaseAllowance(debtPackage.address, 500, { from: accounts[2] });
        await debtPackage.fund(accounts[2], debtTokenTwo.address, 500);


        let maxFund = await debtPackage.maxFund();
        maxFund = Number(maxFund.valueOf());
        let balance = await debtPackage.tokenBalance();
        assert.equal(Number(balance.valueOf()), maxFund * 2, 'should be 600');

        await increaseTime(duration.minutes(70));
    });

    it('should be retrieved the debt tokens properly', async() => {
        let tokenAmount = await debtTokenOne.balanceOf(accounts[1]);
        tokenAmount = Number(tokenAmount.valueOf());

        let tokenAmountOnPackage = await debtPackage.tokens(debtTokenOne.address);

        await debtPackage.retrieveDebt(debtTokenOne.address, { from: accounts[1] });

        tokenAmountOnPackage = Number(tokenAmountOnPackage.valueOf());

        let currentTokenAmount = await debtTokenOne.balanceOf(accounts[1]);
        currentTokenAmount = Number(currentTokenAmount.valueOf());

        assert.equal(currentTokenAmount, tokenAmount + tokenAmountOnPackage, 'should be the same');
    });

});
