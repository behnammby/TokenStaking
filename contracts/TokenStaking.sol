// SPDX-License-Identifier: MIT
// Erc20 token staking smart contract
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./Utils.sol";

/**
 * @dev An smart contract for staking any ERC20 token
 */

contract TokenStaking is Ownable, ReentrancyGuard {
    struct Staker {
        uint256 stakedAmount;
        uint256 startTime;
        uint256 stakingPlan;
    }

    IERC20 private _token;
    mapping(address => Staker) private _stakers;

    event Staked(address indexed user, uint256 amount, uint256 stakingPlan);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    /**
     * @dev Constructor sets the ERC20 token that can be used for staking
     */
    constructor(address _tokenAddress) {
        _token = IERC20(_tokenAddress);
    }

    /**
     * @dev stake function will be used to stake tokens
     * @param _amount | the amount of token to be transfered
     * @param _stakingPlan | the staking plan index
     */
    function stake(
        uint256 _amount,
        uint256 _stakingPlan
    ) external nonReentrant {
        // Checking the staking amount
        require(_amount > 0, "Amount must be greator than zero.");

        // Checking to see if the chosen staking plan is valid
        require(
            Utils.isStakingPlanValid(_stakingPlan),
            "Staking plan number isn't valid."
        );

        // Get staker from storage
        Staker storage _staker = _getStaker(_msgSender());

        // Check to see if the staker is already staking or not
        require(
            _staker.stakedAmount == 0,
            "The staker is staking already, restaking isn't allowed unless unstaked first."
        );

        // Check to see if the allowance mechanism is enabled by the staker
        require(
            _token.allowance(_msgSender(), address(this)) >= _amount,
            "Staker hasn't allowed the staking contract to transfer funds"
        );

        // Check to see if the token is transferred to our contract
        require(
            _token.transferFrom(_msgSender(), address(this), _amount),
            "Transfering funds failed."
        );

        // Fill up staker information
        // Note that we save the plan index, not the duration or anything else
        _staker.startTime = block.timestamp;
        _staker.stakingPlan = _stakingPlan;
        _staker.stakedAmount = _amount;

        // Emit staked event to announce successfull stake
        emit Staked(_msgSender(), _amount, _stakingPlan);
    }

    /**
     * @dev This function will be called to withdraw the staked amount and possible reward
     */
    function unstake() external nonReentrant {
        // Get the staker from storage
        Staker storage _staker = _getStaker(_msgSender());

        // Check to see if staker amount is non-zero
        require(
            _staker.stakedAmount > 0,
            "Staker hasn't staked any tokens or unstaked already."
        );

        uint256 _minStakingDuration = Utils.convertPlanToDuration(
            _staker.stakingPlan
        );
        uint256 _timeElapsed = Utils.calculateTimeElapsed(
            block.timestamp,
            _staker.startTime
        );

        string memory _blockTimeStampStr = Strings.toString(block.timestamp);
        string memory _startTimeStr = Strings.toString(_staker.startTime);
        string memory _timeElapsedStr = Strings.toString(_timeElapsed);
        string memory _minStakingDurationStr = Strings.toString(
            _minStakingDuration
        );

        // Check to see if the minimum duration is passed
        require(
            _timeElapsed >= _minStakingDuration,
            string(
                abi.encodePacked(
                    "Staking duration isn't yet passed, elapsed= ",
                    _timeElapsedStr,
                    ", needed= ",
                    _minStakingDurationStr,
                    ", block timestamp= ",
                    _blockTimeStampStr,
                    ", start time= ",
                    _startTimeStr
                )
            )
        );

        // We need to copy _staker.stakedAmount to a variable
        // for calulating total amount and event emit
        uint256 _stakedAmount = _staker.stakedAmount;

        uint256 _rewardAmount = Utils.calculateReward(
            _timeElapsed,
            _staker.stakedAmount
        );

        // Safely setting stakedAmount of staker to zero
        _staker.stakedAmount = 0;

        // Calculating total amount
        uint256 _totalAmount = _stakedAmount + _rewardAmount;

        // Check to see if transfer is successfull
        require(
            _token.transfer(_msgSender(), _totalAmount),
            "Unstaking failed. Couldn't transfer funds to the sender."
        );

        emit Unstaked(_msgSender(), _stakedAmount, _rewardAmount);
    }

    /**
     * @dev Get the sender staked amount
     */
    function getMyStakedAmount() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        return _staker.stakedAmount;
    }

    /**
     * @dev Get the sender staking plan index
     */
    function getMyStakingPlan() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        return _staker.stakingPlan;
    }

    /**
     * @dev Get the staker start timestamp
     */
    function getMyStakingStartTime() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        return _staker.startTime;
    }

    /**
     * @dev Get the staker remaining duration to pass the minimum required staking duration
     */
    function getMyStakingRemainingTime() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        uint256 _duration = Utils.convertPlanToDuration(_staker.stakingPlan);

        uint256 _timeElapsed = Utils.calculateTimeElapsed(
            block.timestamp,
            _staker.startTime
        );

        if (_timeElapsed >= _duration) {
            return 0;
        }

        return (_duration - _timeElapsed);
    }

    /**
     * @dev Calculate required staking duration is seconds
     */
    function getMyStakingMinDuration() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        uint256 _duration = Utils.convertPlanToDuration(_staker.stakingPlan);

        return _duration;
    }

    /**
     * @dev Get the staker staking time elapsed in seconds
     */
    function getMyStakingTimeElapsed() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        uint256 _timeElapsed = Utils.calculateTimeElapsed(
            block.timestamp,
            _staker.startTime
        );

        return _timeElapsed;
    }

    /**
     * @dev Calculate the staker profit from staking token
     */
    function getMyStakingProfit() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        uint256 _minStakingDuration = Utils.convertPlanToDuration(
            _staker.stakingPlan
        );
        uint256 _timeElapsed = Utils.calculateTimeElapsed(
            block.timestamp,
            _staker.startTime
        );

        if (_timeElapsed >= _minStakingDuration) {
            uint256 _rewardAmount = Utils.calculateReward(
                _timeElapsed,
                _staker.stakedAmount
            );

            return _rewardAmount;
        }

        return 0;
    }

    /**
     * @dev Get staker data from storage
     * @param _stakerAddress the address of staker to get information
     */
    function _getStaker(
        address _stakerAddress
    ) private view returns (Staker storage) {
        Staker storage staker = _stakers[_stakerAddress];

        return staker;
    }
}
