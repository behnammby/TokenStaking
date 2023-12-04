const BitToken = artifacts.require("BitToken")

module.exports = function (_deployer) {
  // Use deployer to state migration tasks.
  const name = 'BitToken';
  const symbol = 'BTX';
  const swapAtPercent = 1;
  const utilityWallet = '0x416918c4736453B85Ba1D69138216d307b7c0bc4';
  const utilityActive = false;
  const buyFee = 0;
  const sellFee = 0;

  _deployer.deploy(BitToken, name, symbol, swapAtPercent, utilityWallet, utilityActive, buyFee, sellFee);
};