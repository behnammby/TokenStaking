const TokenStaking = artifacts.require("TokenStaking")
const MockToken = artifacts.require("MockToken")
const Utils = artifacts.require("Utils")

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  _deployer.link(Utils, TokenStaking)
  _deployer.deploy(TokenStaking, MockToken.address)
};
