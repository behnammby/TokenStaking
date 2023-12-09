const TokenStaking = artifacts.require("TokenStaking")
const BitToken = artifacts.require("BitToken")
// const Utils = artifacts.require("Utils")

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  // _deployer.link(Utils, TokenStaking)
  // const tokenAddress = '0xB3583f60d5c1FFCfD1124950213f5C96F3acd426';
  const tokenAddress = BitToken.address;

  _deployer.deploy(TokenStaking, tokenAddress)
};
