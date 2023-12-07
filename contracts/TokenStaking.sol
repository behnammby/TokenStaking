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
        uint256 lastInteractionAt;
        uint256 currentAmount;
        uint256 reward;
        StakeTransaction[] transactions;
    }

    IERC20 private _token;
    mapping(address => Staker) private _stakers;
    address[] private _blacklist;

    uint256 public minStakingAmount = 500 * (10 ** 18); // 500 tokens
    uint256 public rollingDay = 7 * 24 * 60 * 60; // 7 Days

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    /**
     * @dev Constructor sets the ERC20 token that can be used for staking
     */
    constructor(address _tokenAddress) {
        _token = IERC20(_tokenAddress);
    }

    ///////////////////////// ADMIN /////////////////////////
    /**
     * @dev Sets rolling day that is used to calculate average
     * @param _rollingDay | the rolling day in seconds e.g. 7 * 24 * 60 * 60 = 604800 seconds
     */
    function setRollingDay(uint256 _rollingDay) external onlyOwner {
        require(
            rollingDay > 0,
            "Rolling day couldn't be less that or equal to zero"
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

    ///////////////////////// USER /////////////////////////
    /**
     * @dev Stakes tokens & transfers them to the contract
     * @param _amount | the amount of tokens to be staked
     */
    function stake(uint256 _amount) external nonReentrant {
        // Checking the staking amount
        require(
            _amount >= minStakingAmount,
            "Amount must be greator than min staking amount."
        );

        // Checking for blacklist
        require(!_isBlacklist(_msgSender()), "The address is in blacklist");

        // Get staker from storage
        Staker storage _staker = _getStaker(_msgSender());

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
        _staker.lastInteractionAt = block.timestamp;
        _staker.currentAmount += _amount;

        StakeTransaction memory txn;
        txn.updatedAt = block.timestamp;
        txn.amount = _staker.currentAmount;

        _staker.transactions.push(txn);

        // Emit staked event to announce successfull stake
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
            "Staker can't unstake more that current staked amount"
        );

        _staker.lastInteractionAt = block.timestamp;
        _staker.currentAmount -= _amount;

        StakeTransaction memory txn;
        txn.updatedAt = block.timestamp;
        txn.amount = _staker.currentAmount;

        _staker.transactions.push(txn);

        // Check to see if transfer is successfull
        require(
            _token.transfer(_msgSender(), _amount),
            "Unstaking failed. Couldn't transfer funds to the sender."
        );

        emit Unstaked(_msgSender(), _amount);
    }

    /**
     * @dev Gets sender current staked amount
     */
    function getMyStakedAmount() external view returns (uint256) {
        Staker storage _staker = _getStaker(_msgSender());

        return _staker.currentAmount;
    }

    /**
     * @dev Gets staker start timestamp
     */
    function getMyStakingStartTime() external view returns (uint256) {
        uint256 startTime = _getStakerStartTime(_msgSender());
        return startTime;
    }

    /**
     * @dev Gets staker staking time elapsed in seconds
     */
    function getMyStakingTimeElapsed() external view returns (uint256) {
        uint256 startTime = _getStakerStartTime(_msgSender());

        uint256 timeElapsed = block.timestamp - startTime;
        return timeElapsed;
    }

    /**
     * @dev Calculate the staker profit from staking token
     */
    function getMyStakingProfit() external view returns (uint256) {
        return 0;
    }

    /**
     * @dev Calculate staker daily average
     * @param since | the time to start calculating average from
     */
    function getMyAverage(uint256 since) external view returns (uint256) {
        return _getAverage(_msgSender(), since);
    }

    /**
     * @dev Get staker staked amont at specified time
     * @param at | the time t return staked amount at
     */
    function getMyStakedAmount(uint256 at) external view returns (uint256) {
        return _getAmountAt(_msgSender(), at);
    }

    ///////////////////////// PRIVATE /////////////////////////
    /**
     * @dev Gets staker start time
     * @param _stakerAddress | the address of staker
     */
    function _getStakerStartTime(
        address _stakerAddress
    ) private view returns (uint256) {
        Staker storage _staker = _getStaker(_stakerAddress);

        uint256 startTime = 0;
        if (_staker.transactions.length != 0) {
            StakeTransaction memory txn = _staker.transactions[0];
            startTime = txn.updatedAt;
        }

        return startTime;
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
     * @dev Get the staked amount of a staker at a specified time
     */
    function _getAmountAt(
        address _stakerAddress,
        uint256 at
    ) private view returns (uint256) {
        Staker storage _staker = _getStaker(_stakerAddress);

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
     * @dev Calculating average amount from a specified time til now
     */
    function _getAverage(
        address _stakerAddress,
        uint256 since
    ) private view returns (uint256) {
        Staker storage _staker = _getStaker(_stakerAddress);

        uint256 startBalance = _getAmountAt(_stakerAddress, since);
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
