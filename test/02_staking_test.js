const ethers = require('ethers');
const BitToken = artifacts.require("BitToken");
const StakingContract = artifacts.require("TokenStaking");

const { advanceInTime, mine, block } = require("../scripts/app");
const { catchRevert } = require("../scripts/exceptions");

const stakeAmounts = [
  [
    ethers.utils.parseUnits('100', 18),
    ethers.utils.parseUnits('200', 18),
    ethers.utils.parseUnits('300', 18),
    ethers.utils.parseUnits('500', 18),
    ethers.utils.parseUnits('600', 18),
    ethers.utils.parseUnits('700', 18),
  ],
  [
    ethers.utils.parseUnits('100', 18),
    ethers.utils.parseUnits('100', 18),
    ethers.utils.parseUnits('200', 18),
    ethers.utils.parseUnits('100', 18),
    0,
    0
  ]
];

const withdrawAmounts = [
  [
    0,
    0,
    0,
    ethers.utils.parseUnits('200', 18),
    ethers.utils.parseUnits('100', 18),
    ethers.utils.parseUnits('100', 18),
  ],
];

const timeElapsed = [
  [0, 0, 0, 86400, 86400, 86400],
  [0, 0, 86400, 172800, 172800, 172800],
];

const validity = [
  [false, false, false, true, true, true],
  [false, false, true, true, true, true],
];

contract("Token staking complementery tests", function (accounts) {
  it("TRANSFER TOKENS", async function () {
    const mockToken = await BitToken.deployed();

    const amount = ethers.utils.parseUnits('100000', 18);
    for (let i = 1; i <= 6; i++) {
      await mockToken.transfer(accounts[i], amount, { from: accounts[0] });
    }
  });
  it(" -----------------------", async function () {
    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("STAKE STEP 00", async function () {
    const step = 0;
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    for (let i = 0; i < stakeAmounts.at(step).length; i++) {
      const amount = stakeAmounts.at(step).at(i);
      await mockToken.approve(stakingContract.address, amount, { from: accounts.at(i + 1) });
      await stakingContract.stake(amount, { from: accounts[i + 1] });

      const got = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(i + 1) });

      let expected = ethers.utils.parseUnits('0', 18);
      for (j = 0; j <= step; j++) {
        expected = expected.add(stakeAmounts.at(j).at(i));
      }
      assert.equal(got.toString(), expected.toString(), `Staked amount is wrong for user ${i + 1}`);
    }
  });
  it("1 DAY LATER", async function () {
    await advanceInTime(24 * 60 * 60);
    await mine();
  });
  it(" -----------------------", async function () {
    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("CHECK TIME ELAPSED", async function () {
    const step = 0;
    const stakingContract = await StakingContract.deployed();
    for (let i = 0; i < timeElapsed.at(step).length; i++) {
      const got = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(i + 1) });
      assert(got.toString() >= timeElapsed.at(step).at(i), `Wrong time elapsed for account ${i + 1}`);
    }
  });
  it("CHECK VALIDITY", async function () {
    const step = 0;
    const stakingContract = await StakingContract.deployed();
    for (let i = 0; i < validity.at(step).length; i++) {
      const got = await stakingContract.getMyStakingValidity({ from: accounts.at(i + 1) });
      assert.equal(got, validity.at(step).at(i), `Wrong validity for account ${i + 1}`);
    }
  });
  it("STAKE STEP 01", async function () {
    const step = 1;
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    for (let i = 0; i < stakeAmounts.at(step).length; i++) {
      const amount = stakeAmounts.at(step).at(i);
      await mockToken.approve(stakingContract.address, amount, { from: accounts.at(i + 1) });
      await stakingContract.stake(amount, { from: accounts[i + 1] });

      const got = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(i + 1) });

      let expected = ethers.utils.parseUnits('0', 18);
      for (j = 0; j <= step; j++) {
        expected = expected.add(stakeAmounts.at(j).at(i));
      }
      assert.equal(got.toString(), expected.toString(), `Staked amount is wrong for user ${i + 1}`);
    }
  });
  it("1 DAY LATER", async function () {
    await advanceInTime(24 * 60 * 60);
    await mine();
  });
  it(" -----------------------", async function () {
    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("CHECK TIME ELAPSED", async function () {
    const step = 1;
    const stakingContract = await StakingContract.deployed();
    for (let i = 0; i < timeElapsed.at(step).length; i++) {
      const got = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(i + 1) });
      assert(got.toString() >= timeElapsed.at(step).at(i), `Wrong time elapsed for account ${i + 1}`);
    }
  });
  it("CHECK VALIDITY", async function () {
    const step = 1;
    const stakingContract = await StakingContract.deployed();
    for (let i = 0; i < validity.at(step).length; i++) {
      const got = await stakingContract.getMyStakingValidity({ from: accounts.at(i + 1) });
      assert.equal(got, validity.at(step).at(i), `Wrong validity for account ${i + 1}`);
    }
  });
  it("WITHDRAW STEP 00", async function () {
    const step = 0;
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    for (let i = 0; i < withdrawAmounts.at(step).length; i++) {
      const amount = withdrawAmounts.at(step).at(i);
      await stakingContract.unstake(amount, { from: accounts[i + 1] });

      const got = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(i + 1) });

      let expected = ethers.utils.parseUnits('0', 18);
      for (j = 0; j <= step; j++) {
        expected = expected.add(withdrawAmounts.at(j).at(i));
      }
      assert.equal(got.toString(), expected.toString(), `Staked amount is wrong for user ${i + 1}`);
    }
  });
});