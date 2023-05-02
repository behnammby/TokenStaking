// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 *@dev A set of tools
 * */
library Utils {
    /**
     * @dev this function allows us to specify diferrent time units e.g. minutes, days, etc.
     */
    function _timeUnit() private pure returns (uint256) {
        return 1 minutes;
    }

    /**
     * @dev staking plan is just a number and the actual staking duration is defined here
     * @param _stakingPlan The index of plan e.g. 1, 2, or 3
     */
    function _stakingDuration(
        uint256 _stakingPlan
    ) private pure returns (uint256) {
        if (_stakingPlan == 1) {
            return 1;
        } else if (_stakingPlan == 2) {
            return 5;
        } else if (_stakingPlan == 3) {
            return 10;
        }

        revert();
    }

    /**
     * @dev The staking reward percentage will be defined here
     * @param _stakingPlan the index of staking plan
     */
    function _stakingRewardPercentage(
        uint256 _stakingPlan
    ) private pure returns (uint256) {
        if (_stakingPlan == 1) {
            return 1;
        } else if (_stakingPlan == 2) {
            return 5;
        } else if (_stakingPlan == 3) {
            return 10;
        }

        revert();
    }

    /**
     * @dev we only allows the defined indexes for staking plans
     * @param _stakingPlan the index number of plan
     */
    function isStakingPlanValid(
        uint256 _stakingPlan
    ) public pure returns (bool) {
        return 1 <= _stakingPlan && _stakingPlan <= 3;
    }

    /**
     * @dev This function allows us to convert an staking plan to duration
     *      duration is a unit of time e.g. 1 days, 2 days, etc. in seconds
     * @param _stakingPlan the index number of plan
     */
    function convertPlanToDuration(
        uint256 _stakingPlan
    ) internal pure returns (uint256) {
        return _stakingDuration(_stakingPlan) * _timeUnit();
    }

    /**
     * @dev Gets block timestamp and calculates the staking time elapsed in seconds
     * @param blockTimeStamp block timestamp to calculate time elapsed
     * @param stakingStartTime Start time of staking in seconds
     */
    function calculateTimeElapsed(
        uint256 blockTimeStamp,
        uint256 stakingStartTime
    ) internal pure returns (uint256) {
        uint256 _duration = blockTimeStamp - stakingStartTime;
        return _duration;
    }

    /**
     * @dev Calculates the reward percentage based on staking time elapsed
     * @param _timeElapsed The staking time elapsed in seconds
     */
    function calculateRewardPercentage(
        uint256 _timeElapsed
    ) private pure returns (uint256) {
        if (_timeElapsed >= _stakingDuration(3) * _timeUnit()) {
            return _stakingRewardPercentage(3);
        } else if (_timeElapsed >= _stakingDuration(2) * _timeUnit()) {
            return _stakingRewardPercentage(2);
        } else if (_timeElapsed >= _stakingDuration(1) * _timeUnit()) {
            return _stakingRewardPercentage(1);
        }

        revert();
    }

    /**
     * @dev Calculates reward amount based on reward percentage and staked amount
     * @param _stakedAmount The staker staked amount
     * @param _rewardPercentage The calculated reward percentage
     */
    function calculateRewardAmount(
        uint256 _stakedAmount,
        uint256 _rewardPercentage
    ) private pure returns (uint256) {
        uint256 reward = (_stakedAmount * _rewardPercentage) / 100;

        return reward;
    }

    /**
     * @dev Calculates the reward based on time elapsed and staked amount.
     * @param _timeElapsed The staking time elapsed
     * @param _stakedAmount The staked amount
     */
    function calculateReward(
        uint256 _timeElapsed,
        uint256 _stakedAmount
    ) internal pure returns (uint256) {
        uint256 _rewardPercentage = calculateRewardPercentage(_timeElapsed);
        uint256 _rewardAmount = calculateRewardAmount(
            _stakedAmount,
            _rewardPercentage
        );

        return _rewardAmount;
    }
}
