// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRewardToken {
    function burnFrom(address account, uint256 amount) external;
}

contract TokenA is ERC20, Ownable {
    uint256 public constant PRICE_IN_WEI = 1;
    uint256 public constant PRICE_IN_REWARD_TOKENS = 100;

    IRewardToken public rewardToken;

    constructor(
        address _rewardToken
    ) ERC20("TokenA", "TKA") Ownable(msg.sender) {
        rewardToken = IRewardToken(_rewardToken);
        _mint(msg.sender, 1000000 * (10 ** decimals())); // Initial supply
    }

    function buyWithETH() external payable {
        uint256 amountToBuy = msg.value / PRICE_IN_WEI;
        _mint(msg.sender, amountToBuy * 10 ** 18);
    }

    function buyWithRewardTokens(uint256 rewardTokenAmount) external {
        uint256 amountToBuy = rewardTokenAmount / PRICE_IN_REWARD_TOKENS;
        rewardToken.burnFrom(msg.sender, rewardTokenAmount);
        _mint(msg.sender, amountToBuy);
    }
}
