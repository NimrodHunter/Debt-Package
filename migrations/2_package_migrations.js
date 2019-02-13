const SafeMath = artifacts.require("openzeppelin-solidity/contracts/math/SafeMath.sol");
const Package = artifacts.require("./Package.sol");

module.exports = function(deployer){
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, Package);
};
