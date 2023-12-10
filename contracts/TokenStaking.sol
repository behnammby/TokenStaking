// SPDX-License-Identifier: MIT
// Erc20 token staking smart contract
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @dev An smart contract for staking any ERC20 token
 */
contract TokenStaking is Ownable, ReentrancyGuard {
    struct StakeTransaction {
        uint256 amount;
        uint256 updatedAt;
    }

    struct Staker {
        uint256 holderIndex;
        uint256 startTime;
        uint256 currentAmount;
        uint256 reward;
        uint256 totalReward;
        bool isValid;
        StakeTransaction[] transactions;
    }

    IERC20 private _token;

    uint256 public rewardTreasury = 0;
    uint256 public totalReward = 0;
    uint256 public totalLocked = 0;
    uint256 public totalClaimed = 0;

    address[] private _blacklist;
    address[] private _stakersIndex;

    mapping(address => Staker) private _stakers;

    uint256 public minStakingAmount = 500 * (10 ** 18); // 500 tokens
    uint256 public rollingDay = 7 * 24 * 60 * 60; // 7 Days

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event RewardAdded(uint256 amount);
    event RewardDistributed(uint256 amount);

    /**
     * @dev Constructor sets the ERC20 token that can be used for staking
     */
    constructor(address _tokenAddress) {
        _token = IERC20(_tokenAddress);

        // This line is added to avoid holder index default value hole
        _stakersIndex.push(address(0x0));
    }

    ///////////////////////// ADMIN /////////////////////////
    /**
     * @dev Sets rolling day that is used to calculate average
     * @param _rollingDay | the rolling day in seconds e.g. 7 * 24 * 60 * 60 = 604800 seconds
     */
    function setRollingDay(uint256 _rollingDay) external onlyOwner {
        require(
            rollingDay > 0,
            "Rolling day couldn't be less than or equal to zero"
        );

        rollingDay = _rollingDay;
    }

    /**
     * @dev Sets the minimum amount a staker is allowed to satke
     * @param _minStakingAmount | the amount in token unit e.g. 500 * 10**18
     */
    function setMinStakingAmount(uint256 _minStakingAmount) external onlyOwner {
        minStakingAmount = _minStakingAmount;
    }

    /**
     * @dev Adds an address to blacklist
     * @param _address | the address to be added to blacklist
     */
    function addToBlacklist(address _address) external onlyOwner {
        if (_isBlacklist(_address)) {
            return;
        }

        _blacklist.push(_address);
    }

    /**
     * @dev Adds an address to blacklist
     * @param _address | the address to be added to blacklist
     */
    function removeFromBlacklist(address _address) external onlyOwner {
        if (!_isBlacklist(_address)) {
            return;
        }

        for (uint256 i = 0; i < _blacklist.length; i++) {
            if (_blacklist[i] == _address) {
                delete _blacklist[i];

                break;
            }
        }
    }

    /**
     * @dev Get all blacklisted addresses
     */
    function getBlacklist() external view onlyOwner returns (address[] memory) {
        return _blacklist;
    }

    /**
     * @dev Increasing reward treasury by transferring tokens to the contract
     * @param _amount | the amount of tokens to be transferred to the contract
     */
    function addReward(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Reward amount must be greator than zero");

        require(
            _token.allowance(_msgSender(), address(this)) >= _amount,
            "Admin hasn't allowed the staking contract to transfer funds"
        );

        require(
            _token.transferFrom(_msgSender(), address(this), _amount),
            "Transfering funds failed."
        );

        rewardTreasury += _amount;
        totalReward += _amount;

        emit RewardAdded(_amount);
    }

    /**
     * @dev Calculates total rates of eligible stakers
     */
    function getTotalRates() external view onlyOwner returns (uint256) {
        uint256 _since = block.timestamp - rollingDay;
        uint256 _totalrates = _calculateTotalRates(_since);

        return _totalrates;
    }

    /**
     * @dev Distributes rewards collected in reward treasury between eligible stakers
     */
    function distributeReward() external onlyOwner {
        uint256 _since = block.timestamp - rollingDay;
        _distributeReward(_since);
    }

    ///////////////////////// USER /////////////////////////
    /**
     * @dev Stakes tokens & transfers them to the contract
     * @param _amount | the amount of tokens to be staked
     */
    function stake(uint256 _amount) external nonReentrant {
        // Checking for blacklist
        require(!_isBlacklist(_msgSender()), "The address is in blacklist");

        // // Check to see if the allowance mechanism is enabled by the staker
        require(
            _token.allowance(_msgSender(), address(this)) >= _amount,
            "Staker hasn't allowed the staking contract to transfer funds"
        );

        // Check to see if the token is transferred to our contract
        require(
            _token.transferFrom(_msgSender(), address(this), _amount),
            "Transfering funds failed."
        );

        // Get staker from storage
        Staker storage _staker = _getStaker(_msgSender());

        // Add staker address to staker index if not already
        if (_staker.holderIndex == 0) {
            _staker.holderIndex = _stakersIndex.length;

            // Assert default values
            _staker.startTime = 0;
            _staker.isValid = false;
            _staker.currentAmount = 0;
            _staker.reward = 0;
            _staker.totalReward = 0;

            _stakersIndex.push(_msgSender());
        }

        // Fill up staker information
        _staker.currentAmount += _amount;
        if (!_staker.isValid) {
            if (_staker.currentAmount >= minStakingAmount) {
                _staker.startTime = block.timestamp;
                _staker.isValid = true;
            }
        }

        // Create a new txn
        StakeTransaction memory txn;
        txn.updatedAt = block.timestamp;
        txn.amount = _staker.currentAmount;

        // Add txn to transactions list of the staker
        _staker.transactions.push(txn);

        // Increase total locked
        totalLocked += _amount;

        // Emit staked event to announce successfull staking
        emit Staked(_msgSender(), _amount);
    }

    /**
     * @dev Withdraws specified amount of staked amount, transfer tokens to sender
     * @param _amount | the amount of token to withdraw in token unit e.g. 200 * 10**18
     */
    function unstake(uint256 _amount) external nonReentrant {
        // Checking the staking amount
        require(_amount > 0, "Amount must be greator than zero.");

        // Get the staker from storage
        Staker storage _staker = _getStaker(_msgSender());

        // Check to see if staker amount is non-zero
        require(
            _staker.currentAmount >= _amount,
            "Staker can't unstake more than current staked amount"
        );

        _staker.currentAmount -= _amount;
        if (_staker.isValid) {
            if (_staker.currentAmount < minStakingAmount) {
                _staker.startTime = 0;
                _staker.isValid = false;
            }
        }

        StakeTransaction memory txn;
        txn.updatedAt = block.timestamp;
        txn.amount = _staker.currentAmount;

        _staker.transactions.push(txn);

        // Decrease locked amount
        totalLocked -= _amount;

        // Check to see if transfer is successfull
        require(
            _token.transfer(_msgSender(), _amount),
            "Unstaking failed. Couldn't transfer funds to the sender."
        );

        emit Unstaked(_msgSender(), _amount);
    }

    /**
     * @dev Withdraws specified amount of staked amount, transfer tokens to sender
     * @param _amount | the amount of token to withdraw in token unit e.g. 200 * 10**18
     * @param _to | the address to which reward will be transferred
     */
    function claimReward(uint256 _amount, address _to) external nonReentrant {
        // Get the staker from storage
        Staker storage _staker = _getStaker(_msgSender());

        // Checking the staking amount
        require(
            _amount <= _staker.reward,
            "Amount must be less that or equal to reward."
        );

        _staker.reward -= _amount;
        totalClaimed += _amount;

        // Check to see if transfer is successfull
        require(
            _token.transfer(_to, _amount),
            "Unstaking failed. Couldn't transfer funds to the sender."
        );

        emit Claimed(_to, _amount);
    }

    /**
     * @dev Gets sender current staked amount
     */
    function getMyCurrentStakedAmount() external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());

        return _staker.currentAmount;
    }

    /**
     * @dev Gets staker staked amont at specified time
     * @param at | the time to return staked amount at
     */
    function getMyStakedAmount(uint256 at) external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());

        return _getAmountAt(_staker, at);
    }

    /**
     * @dev Gets the validity status of the staking.
     */
    function getMyStakingValidity() external view returns (bool) {
        Staker memory _staker = _getStaker(_msgSender());

        return _staker.isValid;
    }

    /**
     * @dev Gets staker start timestamp
     */
    function getMyStakingStartTime() external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());

        uint256 startTime = _getStakerStartTime(_staker);
        return startTime;
    }

    /**
     * @dev Gets staker staking time elapsed in seconds
     */
    function getMyStakingTimeElapsed() external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());

        uint256 timeElapsed = _getStakerTimeElapsed(_staker);
        return timeElapsed;
    }

    /**
     * @dev Get the staker distributed profit from staking tokens
     */
    function getMyStakingProfit() external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());

        return _staker.reward;
    }

    /**
     * @dev Get the staker distributed profit from staking tokens
     */
    function getMyStakingTotalProfit() external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());

        return _staker.totalReward;
    }

    /**
     * @dev Calculate staker daily average
     */
    function getMyAverage() external view returns (uint256) {
        Staker memory _staker = _getStaker(_msgSender());
        uint256 _since = block.timestamp - rollingDay;

        return _getAverage(_staker, _since);
    }

    ///////////////////////// PRIVATE /////////////////////////
    /**
     * @dev Gets staker start time
     * @param _staker | the staker
     */
    function _getStakerStartTime(
        Staker memory _staker
    ) private pure returns (uint256) {
        return _staker.startTime;
    }

    function _getStakerTimeElapsed(
        Staker memory _staker
    ) private view returns (uint256) {
        if (_staker.startTime == 0) {
            return 0;
        }
        return block.timestamp - _staker.startTime;
    }

    /**
     * @dev Checks if an address is blacklisted or not
     * @param _address | the address to check
     */
    function _isBlacklist(address _address) private view returns (bool) {
        for (uint256 i = 0; i < _blacklist.length; i++) {
            if (_blacklist[i] == _address) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Calculating average amount from a specified time til now
     * @param since | start time to start calculating average from
     */
    function _getAverage(
        Staker memory _staker,
        uint256 since
    ) private view returns (uint256) {
        uint256 startBalance = _getAmountAt(_staker, since);
        if (startBalance == 0) {
            return 0;
        }

        uint256 lastUpdatedAt = since;
        uint256 lastAmount = startBalance;
        uint256 sum = 0;

        for (uint256 i = 0; i < _staker.transactions.length; i++) {
            StakeTransaction memory txn = _staker.transactions[i];
            if (txn.updatedAt <= since) {
                continue;
            }

            uint256 period = txn.updatedAt - lastUpdatedAt;
            sum += lastAmount * (period / 86400);

            lastUpdatedAt = txn.updatedAt;
            lastAmount = txn.amount;
        }

        uint256 remainedPeriod = block.timestamp - lastUpdatedAt;
        sum += lastAmount * (remainedPeriod / 86400);

        uint256 average = sum / ((block.timestamp - since) / 86400);
        return average;
    }

    /**
     * @dev Get the staked amount of a staker at a specified time
     */
    function _getAmountAt(
        Staker memory _staker,
        uint256 at
    ) private pure returns (uint256) {
        uint256 amount = 0;
        for (uint256 i = 0; i < _staker.transactions.length; i++) {
            StakeTransaction memory txn = _staker.transactions[i];

            if (txn.updatedAt <= at) {
                amount = txn.amount;
            } else {
                break;
            }
        }

        return amount;
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

    /**
     * @dev Distribute reward amoung holders
     * @param _since | start time for calculations
     */
    function _distributeReward(uint256 _since) private {
        uint256 totalAverages = _calculateTotalRates(_since);
        uint256 totalAmount = 0;
        for (uint256 i; i < _stakersIndex.length; i++) {
            if (_stakersIndex[i] == address(0x0)) {
                continue;
            }

            Staker storage _staker = _getStaker(_stakersIndex[i]);
            if (!_staker.isValid) {
                continue;
            }

            if (_staker.startTime > _since) {
                continue;
            }

            uint256 average = _getAverage(_staker, _since);
            if (average == 0) {
                continue;
            }

            uint256 reward = (rewardTreasury * average) / totalAverages;
            totalAmount += reward;

            _staker.reward += reward;
            _staker.totalReward += reward;
        }

        rewardTreasury -= totalAmount;
        emit RewardDistributed(totalAmount);
    }

    /**
     * @dev Calculates total rates of eligible stakers
     * @param _since | start time for calculating total rates
     */
    function _calculateTotalRates(
        uint256 _since
    ) private view returns (uint256) {
        uint256 totalRates;
        for (uint256 i = 0; i < _stakersIndex.length; i++) {
            if (_stakersIndex[i] == address(0x0)) {
                continue;
            }

            Staker memory _staker = _getStaker(_stakersIndex[i]);
            if (!_staker.isValid) {
                continue;
            }

            if (_staker.startTime > _since) {
                continue;
            }

            uint256 average = _getAverage(_staker, _since);
            if (average == 0) {
                continue;
            }

            totalRates += average;
        }

        return totalRates;
    }
}
