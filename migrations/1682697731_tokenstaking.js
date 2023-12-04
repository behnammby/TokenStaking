const TokenStaking = artifacts.require("TokenStaking")
const BitToken = artifacts.require("BitToken")
const Utils = artifacts.require("Utils")

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  _deployer.link(Utils, TokenStaking)
  _deployer.deploy(TokenStaking, BitToken.address)
};
