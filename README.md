# Debt-Package-Contract

[![Coverage Status](https://coveralls.io/repos/github/NimrodHunter/Debt-Package-Contracts/badge.svg)](https://coveralls.io/github/NimrodHunter/Debt-Package-Contracts)

Code that gather debt tokens into a package to be sold in a time auction.

## Overview
The general idea is sell packages of debt, to obtain liquidity in the side of lenders and diversify the risk in the side of the purchaser of the package.

Lenders who have some tokens that represent their participation in any loan, can fund packages of debt, to get liquidity.

The purchaser of the the package, is purchasing a combination of tokens that represent debt, this diversify the risk, 

The package is sold on an time auction machanism, this mean that the price of the package decrease their price linearly, until reach the floor price at the end of the auction period.

If the period pass forward without be fully funded, lenders whoms funded this package can retrieve their debt tokens back.

## Structure

### Funding

At the moment of the contract creation start the funding period. In this period lenders who have tokens that represent their invest in some loan, can fund the package if they want to sell this tokens to get liquidity.

The package have risk limitations base on how the loan mesure their risk, and also limitations in how many tokens of the same kind receive, this is to ensure the risk diversification.

When the package reach some value, the auction start automatically.

### Auction

The price will go between the total amount of tokens that funded the package, to a floor price. Will be an auction period where this price will be decreasing linearly.

If the period pass forward without a purchaser, lenders whoms funded this package can retrieve their debt tokens back.

### Collect Tokens

If there is a purchaser, He can claim the debt tokens when he wants.

Purchaser can fund another package with other conditions or wait for claim the loan collateral or repayment.

## General Diagram

![](https://github.com/NimrodHunter/Debt-Package-Contracts/blob/develop/images/PackageDebt.png "Diagram")

## Analysis

- [surya](https://github.com/NimrodHunter/Debt-Package-Contracts/blob/develop/surya_package_report.md)

- [mythril](https://github.com/NimrodHunter/Debt-Package-Contracts/blob/develop/mythril_analysis.md)


