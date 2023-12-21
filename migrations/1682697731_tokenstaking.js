const TokenStaking = artifacts.require("TokenStaking")
const BitToken = artifacts.require("BitToken")
// const Utils = artifacts.require("Utils")

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  // _deployer.link(Utils, TokenStaking)
  // const tokenAddress = BitToken.address;
  const tokenAddress = '0xB3583f60d5c1FFCfD1124950213f5C96F3acd426'; // Goerli
  // const tokenAddress = '0x5d7ba3b98457fc1fade1f23bb00d2fe1574f63b2'; // Mainnet
  _deployer.deploy(TokenStaking, tokenAddress)
};
