const MockToken = artifacts.require("MockToken")
const StakingContract = artifacts.require("TokenStaking")

const { advanceInTime, mine } = require("../scripts/app")
const { catchRevert } = require("../scripts/exceptions")

contract("TokenStaking", function (accounts) {
	it("should return 100_000 which is the initial balance of mtk", async function () {
		const mockToken = await MockToken.deployed();

		let got = await mockToken.balanceOf(accounts[0])

		return assert.equal(got.toNumber(), 100_000, "The initial balance of mtk isn't 100_000 mtk")
	})

	it("should transfer 100 mtk to accounts[1]", async function () {
		const mockToken = await MockToken.deployed()

		await mockToken.transfer(accounts[1], 100)

		let got = await mockToken.balanceOf(accounts[1])

		assert.equal(got.toNumber(), 100, "Coudn't transfer 100 mtk to accounts[1]")
	})

	it("should transfer 1000 mtk to TokenStaking contract", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await mockToken.transfer(stakingContract.address, 1_000, { from: accounts[0] })

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 1_000, "Couldn't transfer 1_000 mtk to staking token contract")
	})

	it("should allow token staking contract to spend 100 mtk from accounts[1]", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await mockToken.approve(stakingContract.address, 100, { from: accounts[1] })

		let got = await mockToken.allowance(accounts[1], stakingContract.address)

		assert.equal(got, 100, "Allowance isn't set correctly for staking contract to spend 100 mtk from accounts[1]")
	})

	it("should stake 100 mtk", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await stakingContract.stake(100, 1, { from: accounts[1] })

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 1_100, "Staking isn't working correctly")
	})

	it("should return balance of accounts[1] as zero", async function () {
		const mockToken = await MockToken.deployed()

		let got = await mockToken.balanceOf(accounts[1])

		assert.equal(got.toNumber(), 0, "The accounts[1] isn't zero")
	})

	it("should get staked amount as 100", async function () {
		const stakingContract = await StakingContract.deployed()

		let got = await stakingContract.getMyStakedAmount({ from: accounts[1] })

		assert.equal(got, 100, "Couldn't get staked amount correctly")
	})

	it("should get staking plan index as 1", async function () {
		const stakingContract = await StakingContract.deployed()

		let got = await stakingContract.getMyStakingPlan({ from: accounts[1] })

		assert.equal(got, 1, "Couldn't't get staking plan index correctly")
	})

	it("should get min stake duration as 60s", async function () {
		const stakingContract = await StakingContract.deployed()

		let got = await stakingContract.getMyStakingMinDuration({ from: accounts[1] })

		assert.equal(got, 60, "Couldn't get min staking duration correctly")
	})

	it("should get staking start time", async function () {
		const stakingContract = await StakingContract.deployed()

		let block = await web3.eth.getBlock("latest")

		let got = await stakingContract.getMyStakingStartTime({ from: accounts[1] })
		let expected = block.timestamp

		assert.equal(got.toNumber(), expected, "Coudn't get staking start time correctly")
	})

	it("should get min stake remaning time at most 30s", async function () {
		const stakingContract = await StakingContract.deployed()

		await advanceInTime(30)
		await mine()

		let got = await stakingContract.getMyStakingRemainingTime({ from: accounts[1] })

		assert.isAtMost(got.toNumber(), 30, "Couldn't get staking remaning time as 30s")
	})

	it("should abort unstaking because the staking time isn't passed yet", async function () {
		const stakingContract = await StakingContract.deployed()

		catchRevert(stakingContract.unstake({ from: accounts[1] }))
	})

	it("should get min stake remaning time equal to 0s", async function () {
		const stakingContract = await StakingContract.deployed()

		await advanceInTime(60)
		await mine()

		let got = await stakingContract.getMyStakingRemainingTime({ from: accounts[1] })

		assert.equal(got.toNumber(), 0, "Couldn't get staking remaning time as 0s")
	})

	it("should unstake without any errors and send back 100 mtk + 1 mtk as reward", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await stakingContract.unstake({ from: accounts[1] })

		let got = await mockToken.balanceOf(accounts[1])

		assert.equal(got.toNumber(), 101, "Unstake isn't sent back expected value")
	})

	it("should returns the balance of staking contract 999 mtk", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 999, "Balance of staking contract isn't 999 mtk")
	})

	it("should transfer 200 mtk to accounts[2]", async function () {
		const mockToken = await MockToken.deployed()

		await mockToken.transfer(accounts[2], 200, { from: accounts[0] })

		let got = await mockToken.balanceOf(accounts[2])

		assert.equal(got.toNumber(), 200, "Balance of accounts[2] isn't 200 mtk")
	})

	it("should allow to transfer 200 mtk from accounts[2] to staking contract", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await mockToken.approve(stakingContract.address, 200, { from: accounts[2] })

		let got = await mockToken.allowance(accounts[2], stakingContract.address)

		assert.equal(got, 200, "Allowance isn't set correctly from accounts[2] to staking contract as 200 mtk")
	})

	it("should stake 150 mtk for accounts[2] and staking plan 2", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await stakingContract.stake(150, 2, { from: accounts[2] })

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 1_149, "Staking isn't working correctly for accounts[2]")
	})

	it("should revert staking for accounts[2] because it isn't unstaked yet", async function () {
		const stakingContract = await StakingContract.deployed()

		catchRevert(stakingContract.stake(50, 2, { from: accounts[2] }))
	})

	it("should get remaning time at most 60s for accounts[2]", async function () {
		const stakingContract = await StakingContract.deployed()


		await advanceInTime(4 * 60)
		await mine()

		let got = await stakingContract.getMyStakingRemainingTime({ from: accounts[2] })

		assert.isAtMost(got.toNumber(), 60, "Remaning time isn't calculated correctly")
	})

	it("shoud revert unstaking of accounts[2] because time hasn't passed yet", async function () {
		const stakingContract = await StakingContract.deployed()

		catchRevert(stakingContract.unstake())
	})

	it("should unstake accounts[2] staking and return back reward of 7 mtk", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await advanceInTime(60)
		await mine()

		await stakingContract.unstake({ from: accounts[2] })

		let got = await mockToken.balanceOf(accounts[2])

		assert.equal(got.toNumber(), 207, "Reward of 7 mtk isn't sent to accounts[2]")
	})

	it("should return balance of staking contract 992 mtk", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 992, "Balance of staking contract isn't 992 mtk")
	})

	it("should stake 50 mtk for account[2] and plan index 3", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await stakingContract.stake(50, 3, { from: accounts[2] })

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 1_042, "Balance of staking contract isn't 1_042 mtk")
	})

	it("should return remaining time of staking for accounts[2] at most 30s", async function () {
		const stakingContract = await StakingContract.deployed()

		await advanceInTime(570)
		await mine()

		let got = await stakingContract.getMyStakingRemainingTime({ from: accounts[2] })

		assert.isAtMost(got.toNumber(), 30, "Remaning time for accounts[2] isn't 30s at most")
	})

	it("shoudn't allow accounts[2] to unstake", async function () {
		const stakingContract = await StakingContract.deployed()

		catchRevert(stakingContract.unstake({ from: accounts[2] }))
	})

	it("should unstake accounts[2] staking and give 5 mtk as reward", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		await advanceInTime(100)
		await mine()

		await stakingContract.unstake({ from: accounts[2] })

		let got = await mockToken.balanceOf(accounts[2])

		assert.equal(got.toNumber(), 212, "Balance of accounts[2] isn't 212 mtk")
	})

	it("should return balance of staking contract 988 mtk", async function () {
		const mockToken = await MockToken.deployed()
		const stakingContract = await StakingContract.deployed()

		let got = await mockToken.balanceOf(stakingContract.address)

		assert.equal(got.toNumber(), 987, "Balance of staking contract isn't 988 mtk")
	})

});