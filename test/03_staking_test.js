const ethers = require('ethers');
const BitToken = artifacts.require("BitToken");
const StakingContract = artifacts.require("TokenStaking");

const { advanceInTime, mine, block } = require("../scripts/app");
const { catchRevert } = require("../scripts/exceptions");


contract("Token staking complementery tests", function (accounts) {
  it("TRANSFER TOKENS", async function () {
    const mockToken = await BitToken.deployed();

    const amount = ethers.utils.parseUnits('1000', 18);
    for (let i = 1; i <= 5; i++) {
      await mockToken.transfer(accounts[i], amount, { from: accounts[0] });
    }

    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("STAKE WALLET 01 -> 100BTX -- 100BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('100', 18);
    await mockToken.approve(stakingContract.address, amount, { from: accounts.at(1) });
    await stakingContract.stake(amount, { from: accounts.at(1) });

    const balance = await mockToken.balanceOf(accounts.at(1));
    assert.equal(balance.toString(), ethers.utils.parseUnits('900', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(1) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('100', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(1) })
    assert.equal(myValidity, false);
  });
  it("STAKE WALLET 02 -> 500BTX -- 500BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('500', 18);
    await mockToken.approve(stakingContract.address, amount, { from: accounts.at(2) });
    await stakingContract.stake(amount, { from: accounts.at(2) });

    const balance = await mockToken.balanceOf(accounts.at(2));
    assert.equal(balance.toString(), ethers.utils.parseUnits('500', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(2) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('500', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(2) })
    assert.equal(myValidity, true);
  });
  it("STAKE WALLET 03 -> 800BTX -- 800BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('800', 18);
    await mockToken.approve(stakingContract.address, amount, { from: accounts.at(3) });
    await stakingContract.stake(amount, { from: accounts.at(3) });

    const balance = await mockToken.balanceOf(accounts.at(3));
    assert.equal(balance.toString(), ethers.utils.parseUnits('200', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(3) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('800', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(3) })
    assert.equal(myValidity, true);
  });
  it("1 DAY LATER", async function () {
    await advanceInTime(24 * 60 * 60);
    await mine();

    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("STAKE WALLET 01 -> 200BTX -- 300BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('200', 18);
    await mockToken.approve(stakingContract.address, amount, { from: accounts.at(1) });
    await stakingContract.stake(amount, { from: accounts.at(1) });

    const balance = await mockToken.balanceOf(accounts.at(1));
    assert.equal(balance.toString(), ethers.utils.parseUnits('700', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(1) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('300', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(1) })
    assert.equal(myValidity, false);

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(1) })
    assert(parseFloat(startTime.toString()) == 0);

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(1) })
    assert(parseFloat(elapsed.toString()) == 0);
  });
  it("UNSTAKE WALLET 02 -> 100BTX -- 400BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('100', 18);
    await stakingContract.unstake(amount, { from: accounts.at(2) });

    const balance = await mockToken.balanceOf(accounts.at(2));
    assert.equal(balance.toString(), ethers.utils.parseUnits('600', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(2) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('400', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(2) })
    assert.equal(myValidity, false);
  });
  it("ADMIN STATUS", async function () {
    console.debug('------------------------------------------------');
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const rewardTreasury = await stakingContract.rewardTreasury({ from: accounts[0] });
    const totalReward = await stakingContract.totalReward({ from: accounts[0] });
    const totalLocked = await stakingContract.totalLocked({ from: accounts[0] });
    const totalClaimed = await stakingContract.totalClaimed({ from: accounts[0] });
    const balance = await mockToken.balanceOf(stakingContract.address);


    console.debug('   rewardTreasury', ethers.utils.formatUnits(rewardTreasury.toString(), 18));
    console.debug('   totalReward', ethers.utils.formatUnits(totalReward.toString(), 18));
    console.debug('   totalLocked', ethers.utils.formatUnits(totalLocked.toString(), 18));
    console.debug('   totalClaimed', ethers.utils.formatUnits(totalClaimed.toString(), 18));
    console.debug('   balance', ethers.utils.formatUnits(balance.toString(), 18));
    // console.debug('------------------------------------------------');
  });
  it("1 DAY LATER", async function () {
    await advanceInTime(24 * 60 * 60);
    await mine();

    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("STAKE WALLET 01 -> 300BTX -- 600BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('300', 18);
    await mockToken.approve(stakingContract.address, amount, { from: accounts.at(1) });
    await stakingContract.stake(amount, { from: accounts.at(1) });

    const balance = await mockToken.balanceOf(accounts.at(1));
    assert.equal(balance.toString(), ethers.utils.parseUnits('400', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(1) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('600', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(1) })
    assert.equal(myValidity, true);

    const ts = await block();
    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(1) })
    assert(parseFloat(startTime.toString()) == ts);

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(1) })
    assert(parseFloat(elapsed.toString()) == 0);
  });
  it("5 DAY LATER", async function () {
    await advanceInTime(5 * 24 * 60 * 60);
    await mine();

    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("STATUS WALLET 01", async function () {
    console.debug('------------------------------------------------');
    const stakingContract = await StakingContract.deployed();

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(1) })
    console.debug('    WALLET 01 START TIME', startTime.toString());

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(1) })
    console.debug('    WALLET 01 ELAPSED', elapsed.toString());

    const avg = await stakingContract.getMyAverage({ from: accounts.at(1) });
    console.debug('    WALLET 01 AVG', ethers.utils.formatUnits(avg.toString(), 18));
    // console.debug('------------------------------------------------');
  });
  it("STATUS WALLET 02", async function () {
    console.debug('------------------------------------------------');
    const stakingContract = await StakingContract.deployed();

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(2) })
    console.debug('    WALLET 02 START TIME', startTime.toString());

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(2) })
    console.debug('    WALLET 02 ELAPSED', elapsed.toString());

    const avg = await stakingContract.getMyAverage({ from: accounts.at(2) });
    console.debug('    WALLET 02 AVG', ethers.utils.formatUnits(avg.toString(), 18));
    // console.debug('------------------------------------------------');
  });
  it("STATUS WALLET 03", async function () {
    console.debug('------------------------------------------------');
    const stakingContract = await StakingContract.deployed();

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(3) })
    console.debug('    WALLET 03 START TIME', startTime.toString());

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(3) })
    console.debug('    WALLET 03 ELAPSED', elapsed.toString());

    const avg = await stakingContract.getMyAverage({ from: accounts.at(3) });
    console.debug('    WALLET 03 AVG', ethers.utils.formatUnits(avg.toString(), 18));
    // console.debug('------------------------------------------------');
  });
  it("ADMIN ADD REWARD -> 500BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const oldBalance = await mockToken.balanceOf(stakingContract.address);

    const amount = ethers.utils.parseUnits('500', 18);
    await mockToken.approve(stakingContract.address, amount);
    await stakingContract.addReward(amount);

    const newBalance = await mockToken.balanceOf(stakingContract.address);

    const got = await stakingContract.rewardTreasury();
    const expected = amount;

    assert.equal(newBalance.toString(), amount.add(oldBalance.toString()).toString(), "Token balance of staking contract isn't increased.")
    assert.equal(got.toString(), expected.toString(), "Reward treasury isn't increased successfully");
  });
  it("ADMIN CALC TOTAL RATES", async function () {
    const stakingContract = await StakingContract.deployed();

    const got = await stakingContract.getTotalRates({ from: accounts[0] });

    const expected = ethers.utils.parseUnits('800', 18);

    assert.equal(got.toString(), expected.toString(), "Couldn't calculate total rates");
  });
  it("ADMIN STATUS", async function () {
    console.debug('------------------------------------------------');
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const rewardTreasury = await stakingContract.rewardTreasury({ from: accounts[0] });
    const totalReward = await stakingContract.totalReward({ from: accounts[0] });
    const totalLocked = await stakingContract.totalLocked({ from: accounts[0] });
    const totalClaimed = await stakingContract.totalClaimed({ from: accounts[0] });
    const balance = await mockToken.balanceOf(stakingContract.address);


    console.debug('   rewardTreasury', ethers.utils.formatUnits(rewardTreasury.toString(), 18));
    console.debug('   totalReward', ethers.utils.formatUnits(totalReward.toString(), 18));
    console.debug('   totalLocked', ethers.utils.formatUnits(totalLocked.toString(), 18));
    console.debug('   totalClaimed', ethers.utils.formatUnits(totalClaimed.toString(), 18));
    console.debug('   balance', ethers.utils.formatUnits(balance.toString(), 18));
    // console.debug('------------------------------------------------');
  });
  // it("ADMIN DISTRIBUTE REWARD", async function () {
  //   const stakingContract = await StakingContract.deployed();

  //   await stakingContract.distributeReward({ from: accounts[0] });

  //   const got1 = await stakingContract.getMyStakingProfit({ from: accounts[1] });

  //   assert.equal(got1.toString(), ethers.utils.parseUnits('0', 18));
  // });
  it("2 DAY LATER", async function () {
    await advanceInTime(2 * 24 * 60 * 60);
    await mine();

    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("STATUS WALLET 01", async function () {
    console.debug('------------------------------------------------');
    const stakingContract = await StakingContract.deployed();

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(1) })
    console.debug('    WALLET 01 START TIME', startTime.toString());

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(1) })
    console.debug('    WALLET 01 ELAPSED', elapsed.toString());

    const avg = await stakingContract.getMyAverage({ from: accounts.at(1) });
    console.debug('    WALLET 01 AVG', ethers.utils.formatUnits(avg.toString(), 18));
  });
  it("STATUS WALLET 02", async function () {
    console.debug('------------------------------------------------');
    const stakingContract = await StakingContract.deployed();

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(2) })
    console.debug('    WALLET 02 START TIME', startTime.toString());

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(2) })
    console.debug('    WALLET 02 ELAPSED', elapsed.toString());

    const avg = await stakingContract.getMyAverage({ from: accounts.at(2) });
    console.debug('    WALLET 02 AVG', ethers.utils.formatUnits(avg.toString(), 18));
  });
  it("STATUS WALLET 03", async function () {
    console.debug('------------------------------------------------');
    const stakingContract = await StakingContract.deployed();

    const startTime = await stakingContract.getMyStakingStartTime({ from: accounts.at(3) })
    console.debug('    WALLET 03 START TIME', startTime.toString());

    const elapsed = await stakingContract.getMyStakingTimeElapsed({ from: accounts.at(3) })
    console.debug('    WALLET 03 ELAPSED', elapsed.toString());

    const avg = await stakingContract.getMyAverage({ from: accounts.at(3) });
    console.debug('    WALLET 03 AVG', ethers.utils.formatUnits(avg.toString(), 18));
  });
  it("ADMIN CALC TOTAL RATES", async function () {
    const stakingContract = await StakingContract.deployed();

    const got = await stakingContract.getTotalRates({ from: accounts[0] });

    const expected = ethers.utils.parseUnits('1400', 18);

    assert.equal(got.toString(), expected.toString(), "Couldn't calculate total rates");
  });
  it("ADMIN DISTRIBUTE REWARD", async function () {
    const stakingContract = await StakingContract.deployed();

    await stakingContract.distributeReward({ from: accounts[0] });

    const got1 = await stakingContract.getMyStakingProfit({ from: accounts[1] });
    const got2 = await stakingContract.getMyStakingProfit({ from: accounts[2] });
    const got3 = await stakingContract.getMyStakingProfit({ from: accounts[3] });

    // assert.equal(got1.toString(), ethers.utils.parseUnits('214.285714286', 18));
    console.debug('   WALLET 01 REWARD=', ethers.utils.formatUnits(got1.toString(), 18));
    console.debug('   WALLET 02 REWARD=', ethers.utils.formatUnits(got2.toString(), 18));
    console.debug('   WALLET 03 REWARD=', ethers.utils.formatUnits(got3.toString(), 18));
  });
  it("CLAIM WALLET 01 -- REVERT", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();


    const amount = ethers.utils.parseUnits('500', 18);
    catchRevert(stakingContract.claimReward(amount, accounts[7], { from: accounts[1] }));

    // const got = await mockToken.balanceOf(accounts[7]);
    // assert.equal(got.toString(), ethers.utils.parseUnits('500', 18).toString());
  });
  it("CLAIM WALLET 01", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();


    const amount = ethers.utils.parseUnits('214', 18);
    await stakingContract.claimReward(amount, accounts[7], { from: accounts[1] });

    const got = await mockToken.balanceOf(accounts[7]);
    assert.equal(got.toString(), ethers.utils.parseUnits('214', 18).toString());
  });
  it("CLAIM WALLET 03", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();


    const amount = ethers.utils.parseUnits('285', 18);
    await stakingContract.claimReward(amount, accounts[8], { from: accounts[3] });

    const got = await mockToken.balanceOf(accounts[8]);
    assert.equal(got.toString(), ethers.utils.parseUnits('285', 18).toString());
  });
  it("ADMIN STATUS", async function () {
    console.debug('------------------------------------------------');
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const rewardTreasury = await stakingContract.rewardTreasury({ from: accounts[0] });
    const totalReward = await stakingContract.totalReward({ from: accounts[0] });
    const totalLocked = await stakingContract.totalLocked({ from: accounts[0] });
    const totalClaimed = await stakingContract.totalClaimed({ from: accounts[0] });
    const balance = await mockToken.balanceOf(stakingContract.address);


    console.debug('   rewardTreasury', ethers.utils.formatUnits(rewardTreasury.toString(), 18));
    console.debug('   totalReward', ethers.utils.formatUnits(totalReward.toString(), 18));
    console.debug('   totalLocked', ethers.utils.formatUnits(totalLocked.toString(), 18));
    console.debug('   totalClaimed', ethers.utils.formatUnits(totalClaimed.toString(), 18));
    console.debug('   balance', ethers.utils.formatUnits(balance.toString(), 18));
    // console.debug('------------------------------------------------');
  });
  it("1 DAY LATER", async function () {
    await advanceInTime(1 * 24 * 60 * 60);
    await mine();

    const ts = await block();
    console.debug('    ->', new Date(ts * 1000).toLocaleString());
  });
  it("UNSTAKE WALLET 03 -> 600BTX -- 200BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const amount = ethers.utils.parseUnits('600', 18);
    await stakingContract.unstake(amount, { from: accounts.at(3) });

    const balance = await mockToken.balanceOf(accounts.at(3));
    assert.equal(balance.toString(), ethers.utils.parseUnits('800', 18).toString());

    const myAmount = await stakingContract.getMyCurrentStakedAmount({ from: accounts.at(3) })
    assert.equal(myAmount.toString(), ethers.utils.parseUnits('200', 18).toString());

    const myValidity = await stakingContract.getMyStakingValidity({ from: accounts.at(3) })
    assert.equal(myValidity, false);
  });
  it("ADMIN ADD REWARD -> 400BTX", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const oldBalance = await mockToken.balanceOf(stakingContract.address);

    const amount = ethers.utils.parseUnits('400', 18);
    await mockToken.approve(stakingContract.address, amount);
    await stakingContract.addReward(amount);

    const newBalance = await mockToken.balanceOf(stakingContract.address);

    const got = await stakingContract.rewardTreasury();
    const expected = amount;

    assert.equal(newBalance.toString(), amount.add(oldBalance.toString()).toString(), "Token balance of staking contract isn't increased.")
    assert(got.toString() >= expected.toString(), "Reward treasury isn't increased successfully");
  });
  it("ADMIN DISTRIBUTE REWARD", async function () {
    const stakingContract = await StakingContract.deployed();

    await stakingContract.distributeReward({ from: accounts[0] });

    const got1 = await stakingContract.getMyStakingProfit({ from: accounts[1] });
    const got2 = await stakingContract.getMyStakingProfit({ from: accounts[2] });
    const got3 = await stakingContract.getMyStakingProfit({ from: accounts[3] });

    // assert.equal(got1.toString(), ethers.utils.parseUnits('214.285714286', 18));
    console.debug('   WALLET 01 REWARD=', ethers.utils.formatUnits(got1.toString(), 18));
    console.debug('   WALLET 02 REWARD=', ethers.utils.formatUnits(got2.toString(), 18));
    console.debug('   WALLET 03 REWARD=', ethers.utils.formatUnits(got3.toString(), 18));
  });
  it("CLAIM WALLET 01", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();


    const amount = ethers.utils.parseUnits('171', 18);
    await stakingContract.claimReward(amount, accounts[9], { from: accounts[1] });

    const got = await mockToken.balanceOf(accounts[9]);
    assert.equal(got.toString(), ethers.utils.parseUnits('171', 18).toString());
  });
  it("CLAIM WALLET 03 -- REVERT", async function () {
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();


    const amount = ethers.utils.parseUnits('229', 18);
    catchRevert(stakingContract.claimReward(amount, accounts[6], { from: accounts[3] }));

    // const got = await mockToken.balanceOf(accounts[6]);
    // assert.equal(got.toString(), ethers.utils.parseUnits('229', 18).toString());
  });
  it("ADMIN STATUS", async function () {
    console.debug('------------------------------------------------');
    const mockToken = await BitToken.deployed();
    const stakingContract = await StakingContract.deployed();

    const rewardTreasury = await stakingContract.rewardTreasury({ from: accounts[0] });
    const totalReward = await stakingContract.totalReward({ from: accounts[0] });
    const totalLocked = await stakingContract.totalLocked({ from: accounts[0] });
    const totalClaimed = await stakingContract.totalClaimed({ from: accounts[0] });
    const balance = await mockToken.balanceOf(stakingContract.address);


    console.debug('   rewardTreasury', ethers.utils.formatUnits(rewardTreasury.toString(), 18));
    console.debug('   totalReward', ethers.utils.formatUnits(totalReward.toString(), 18));
    console.debug('   totalLocked', ethers.utils.formatUnits(totalLocked.toString(), 18));
    console.debug('   totalClaimed', ethers.utils.formatUnits(totalClaimed.toString(), 18));
    console.debug('   balance', ethers.utils.formatUnits(balance.toString(), 18));
    // console.debug('------------------------------------------------');
  });
});