const ethers = require('ethers');
const BitToken = artifacts.require("BitToken");
const StakingContract = artifacts.require("TokenStaking");

const { advanceInTime, mine, block } = require("../scripts/app");
const { catchRevert } = require("../scripts/exceptions");

contract("Token staking tests", function (accounts) {
	it("^^^^^^", async function () {
		const ts = await block();

		console.debug('    ->', new Date(ts * 1000).toLocaleString());
	});

	it("should has 1_000_000 btx balance for accounts[0]", async function () {
		const mockToken = await BitToken.deployed();

		let got = await mockToken.balanceOf(accounts[0]);
		let expected = ethers.utils.parseUnits('1000000', 18);

		return assert.equal(got.toString(), expected.toString(), "The initial balance of btx isn't 1_000_000 btx")
	});

	it("should transfer 1_000 btx to accounts[1]", async function () {
		const mockToken = await BitToken.deployed()

		let amount = ethers.utils.parseUnits('1000', 18);
		await mockToken.transfer(accounts[1], amount)

		let got = await mockToken.balanceOf(accounts[1])
		let expected = ethers.utils.parseUnits('1000', 18)

		assert.equal(got.toString(), expected.toString(), "Couldn't transfer btx to accounts[1]")
	});

	it('should revert staking of btx due to insufficient allowance of accounts[1]', async function () {
		const stakingContract = await StakingContract.deployed()

		let amount = ethers.utils.parseUnits('500', 18);
		catchRevert(stakingContract.stake(amount, { from: accounts[1] }));
	});

	it("should allow token staking contract to spend 700 btx from accounts[1]", async function () {
		const mockToken = await BitToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let amount = ethers.utils.parseUnits('700', 18);
		await mockToken.approve(stakingContract.address, amount, { from: accounts[1] });

		let got = await mockToken.allowance(accounts[1], stakingContract.address);
		let expected = amount;

		assert.equal(got.toString(), expected.toString(), "Allowance isn't set correctly for staking contract to spend 700 btx from accounts[1]")
	});

	it("should revert staking of 400 btx due to min staking amount limit", async function () {
		const stakingContract = await StakingContract.deployed()

		let amount = ethers.utils.parseUnits('400', 18);
		catchRevert(stakingContract.stake(amount, { from: accounts[1] }))
	});

	it("should stake 500 btx", async function () {
		const mockToken = await BitToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let amount = ethers.utils.parseUnits('500', 18);
		await stakingContract.stake(amount, { from: accounts[1] })

		let got = await mockToken.balanceOf(stakingContract.address)
		let expected = ethers.utils.parseUnits('500', 18);
		assert.equal(got.toString(), expected.toString(), "Staked amount isn't successfully transfered to contract")

		got = await mockToken.balanceOf(accounts[1]);
		expected = ethers.utils.parseUnits('500', 18);
		assert.equal(got.toString(), expected.toString(), "Account balance isn't decreased correctly.");
	});

	it("should advance in time 35 hours", async function () {
		await advanceInTime(60 * 60 * 35);
		await mine();
	});
	it("^^^^^^", async function () {
		const ts = await block();

		console.debug('    ->', new Date(ts * 1000).toLocaleString());
	});

	it("should unstake 300 btx", async function () {
		const mockToken = await BitToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let currentBalance = await mockToken.balanceOf(accounts[1]);

		let amount = ethers.utils.parseUnits('300', 18);
		await stakingContract.unstake(amount, { from: accounts[1] })

		let got = await mockToken.balanceOf(accounts[1])
		let expected = amount.add(BigInt(currentBalance.toString()));
		assert.equal(got.toString(), expected.toString(), "Unstaking tokens isn't working correctly")
	});

	it("should advance in time 76 hours", async function () {
		await advanceInTime(60 * 60 * 76);
		await mine();
	});
	it("^^^^^^", async function () {
		const ts = await block();

		console.debug('    ->', new Date(ts * 1000).toLocaleString());
	});

	it("should stake 500 btx more tokens", async function () {
		const mockToken = await BitToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let increaseAmount = ethers.utils.parseUnits('500', 18);
		await mockToken.approve(stakingContract.address, increaseAmount, { from: accounts[1] });

		let amount = ethers.utils.parseUnits('500', 18);
		await stakingContract.stake(amount, { from: accounts[1] })

		let got = await mockToken.balanceOf(accounts[1])
		let expected = ethers.utils.parseUnits('300', 18);

		assert.equal(got.toString(), expected.toString(), "Staking more tokens isn't working correctly")
	});

	it("should revert unstaking 800 btx", async function () {
		const stakingContract = await StakingContract.deployed();

		let amount = ethers.utils.parseUnits('800', 18);
		catchRevert(stakingContract.unstake(amount, { from: accounts[1] }))
	});

	it("should advance in time 22 hours", async function () {
		await advanceInTime(60 * 60 * 22);
		await mine();
	});

	it("^^^^^^", async function () {
		const ts = await block();

		console.debug('    ->', new Date(ts * 1000).toLocaleString());
	});

	it("should unstake 200 more btx", async function () {
		const mockToken = await BitToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let currentBalance = await mockToken.balanceOf(accounts[1]);

		let amount = ethers.utils.parseUnits('200', 18);
		await stakingContract.unstake(amount, { from: accounts[1] })

		let got = await mockToken.balanceOf(accounts[1])
		let expected = amount.add(BigInt(currentBalance.toString()));

		assert.equal(got.toString(), expected.toString(), "Unstaking more tokens isn't working correctly")
	});

	it("should get staked amount at 22 + 76 + 35 hours ago", async function () {
		const stakingContract = await StakingContract.deployed();

		const ts = await block();

		const since = ts - (22 + 76 + 35) * 3600;
		const got = await stakingContract.getMyStakedAmount(since, { from: accounts[1] });
		const expected = ethers.utils.parseUnits('500', 18);

		assert.equal(got.toString(), expected.toString(), "Couldn't get staked amount at specified time correctly.")
	});

	it("should get staked amount at 22 + 76 hours ago", async function () {
		const stakingContract = await StakingContract.deployed();

		const ts = await block();

		const since = ts - (22 + 76) * 3600;
		const got = await stakingContract.getMyStakedAmount(since, { from: accounts[1] });
		const expected = ethers.utils.parseUnits('200', 18);

		assert.equal(got.toString(), expected.toString(), "Couldn't get staked amount at specified time correctly.")
	});

	it("should get staked amount at now", async function () {
		const stakingContract = await StakingContract.deployed();

		const ts = await block();

		const since = ts;
		const got = await stakingContract.getMyStakedAmount(since, { from: accounts[1] });
		const expected = ethers.utils.parseUnits('500', 18);

		assert.equal(got.toString(), expected.toString(), "Couldn't get staked amount at specified time correctly.")
	});

	it("should return zero as daily average due to not enough period of staking", async function () {
		const stakingContract = await StakingContract.deployed();

		const got = stakingContract.getMyAverage({ from: accounts[1] });
		const expected = ethers.utils.parseUnits('0', 18);

		assert(got.toString(), expected.toString(), "Couldn't get zero for average.");
	});

	it("should advance in time 5 days", async function () {
		await advanceInTime(60 * 60 * 24 * 5);
		await mine();
	});

	it("^^^^^^", async function () {
		const ts = await block();

		console.debug('    ->', new Date(ts * 1000).toLocaleString());
	});

	it("should calculate staking daily average", async function () {
		const stakingContract = await StakingContract.deployed();

		const got = await stakingContract.getMyAverage({ from: accounts[1] });
		const expected = BigInt('385714285714285714285');

		assert.equal(got.toString(), expected.toString(), "Couldn't calculate average correctly");
	});

	it("should stake 1000 btx from accounts[2]", async function () {
		const mockToken = await BitToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let amount = ethers.utils.parseUnits('1000', 18);
		await mockToken.transfer(accounts[2], amount, { from: accounts[0] })

		await mockToken.approve(stakingContract.address, amount, { from: accounts[2] });

		await stakingContract.stake(amount, { from: accounts[2] });

		const ts = await block();
		const got = await stakingContract.getMyStakedAmount(ts + 1, { from: accounts[2] });

		assert.equal(got.toString(), amount.toString(), "Couldn't stake for accounts[2]");
	});

	it("should advance in time 7 days", async function () {
		await advanceInTime(60 * 60 * 24 * 7);
		await mine();
	});

	it("^^^^^^", async function () {
		const ts = await block();

		console.debug('    ->', new Date(ts * 1000).toLocaleString());
	});

	it("should calculate staking daily average", async function () {
		const stakingContract = await StakingContract.deployed();

		const got = await stakingContract.getMyAverage({ from: accounts[2] });
		const expected = ethers.utils.parseUnits('1000', 18);

		assert.equal(got.toString(), expected.toString(), "Couldn't calculate average correctly");
	});

	it("should revert change settings by none admins", async function () {
		const stakingContract = await StakingContract.deployed();

		catchRevert(stakingContract.setRollingDay(5 * 24 * 60 * 60, { from: accounts[1] }));
		catchRevert(stakingContract.setMinStakingAmount(ethers.utils.parseUnits('400', 18), { from: accounts[1] }));
		catchRevert(stakingContract.addToBlacklist(accounts[0], { from: accounts[1] }));
		catchRevert(stakingContract.removeFromBlacklist(accounts[0], { from: accounts[1] }));
	});

	it("should change rolling day", async function () {
		const stakingContract = await StakingContract.deployed();

		const newVal = 5 * 24 * 60 * 60;
		await stakingContract.setRollingDay(newVal, { from: accounts[0] });

		const got = await stakingContract.rollingDay();
		const expected = newVal;

		assert.equal(got.toString(), expected.toString(), "Rolling day isn't set correctly");
	});

	it("should change min staking amount", async function () {
		const stakingContract = await StakingContract.deployed();

		const newVal = ethers.utils.parseUnits('400', 18);
		await stakingContract.setMinStakingAmount(newVal, { from: accounts[0] });

		const got = await stakingContract.minStakingAmount();
		const expected = newVal;

		assert.equal(got.toString(), expected.toString(), "Min staking amount isn't set correctly");
	});

	it("should add an address to blacklist", async function () {
		const stakingContract = await StakingContract.deployed();

		await stakingContract.addToBlacklist(accounts[1], { from: accounts[0] });

		const result = await stakingContract.getBlacklist({ from: accounts[0] });
		console.debug('    Blacklist:', result);

		assert.notEqual(result.indexOf(accounts[1]), -1, "Couldn't add address to blacklist");
	});

	it("should revert staking from accounts[1] since is blacklisted", async function () {
		const stakingContract = await StakingContract.deployed();

		let amount = ethers.utils.parseUnits('500', 18);
		catchRevert(stakingContract.stake(amount, { from: accounts[1] }));
	});

	it("should remove an address from blacklist", async function () {
		const stakingContract = await StakingContract.deployed();

		await stakingContract.removeFromBlacklist(accounts[1], { from: accounts[0] });

		const result = await stakingContract.getBlacklist({ from: accounts[0] });
		console.debug('    Blacklist:', result);

		assert.equal(result.indexOf(accounts[1]), -1, "Couldn't remove address to blacklist");
	});

	it("should add reward", async function () {
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

	it("should calculate total averages", async function () {
		const stakingContract = await StakingContract.deployed();

		const got = await stakingContract.getTotalAverages({ from: accounts[0] });

		const expected = ethers.utils.parseUnits('1500', 18);

		assert.equal(got.toString(), expected.toString(), "Couldn't calculate total averages");
	});

	it("should distribute reward", async function () {
		const stakingContract = await StakingContract.deployed();

		await stakingContract.distributeReward({ from: accounts[0] });

		const got1 = await stakingContract.getMyStakingProfit({ from: accounts[1] });
		const got2 = await stakingContract.getMyStakingProfit({ from: accounts[2] });

		assert.equal(got1.toString(), '166666666666666666666');
		assert.equal(got2.toString(), '333333333333333333333');
	});

	it("should claim reward", async function () {
		const mockToken = await BitToken.deployed();
		const stakingContract = await StakingContract.deployed();


		const amount = BigInt('166666666666666666666');
		await stakingContract.claimReward(amount, { from: accounts[1] });

		const got = await mockToken.balanceOf(accounts[1]);
		assert.equal(got.toString(), '666666666666666666666');
	});
});