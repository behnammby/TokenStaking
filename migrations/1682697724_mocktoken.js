const MockToken = artifacts.require("MockToken")

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  _deployer.deploy(MockToken, "Gold", "GLD", 100_000);
};
