// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";

interface IRewardToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract AMMDEX is Ownable {
    struct Pool {
        uint256 tokenAReserves;
        uint256 tokenBReserves;
    }

    IERC20 public tokenA;
    IERC20 public tokenB;
    IRewardToken public rewardToken;
    uint256 public rewardRate; // Rewards per block per liquidity unit
    uint256 public dynamicFee; // Dynamic fee percentage, adjustable per action

    Pool public pool; // Single pool to track reserves and liquidity
    mapping(address => uint256) public liquidityAProvided;
    mapping(address => uint256) public liquidityBProvided;
    mapping(address => uint256) public lastClaimedBlock;

    event LiquidityAdded(
        address indexed user,
        uint256 amountA,
        uint256 amountB
    );
    event Swap(address indexed user, uint256 amountAIn, uint256 amountBOut);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(
        address _tokenA,
        address _tokenB,
        address _rewardToken,
        uint256 _rewardRate
    ) Ownable(msg.sender) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        rewardToken = IRewardToken(_rewardToken);
        rewardRate = _rewardRate;
        dynamicFee = 2; // Starting fee, can adjust based on liquidity actions
    }

    // Add liquidity to the pool
    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(
            amountA > 0 || amountB > 0,
            "Must provide atleast one token tokens"
        );

        if (amountA > 0) {
            require(
                tokenA.balanceOf(msg.sender) >= amountA,
                "Insufficient balance for tokenA"
            );
            tokenA.transferFrom(msg.sender, address(this), amountA);
            pool.tokenAReserves += amountA;

            liquidityAProvided[msg.sender] += amountA;
        }

        if (amountB > 0) {
            require(
                tokenB.balanceOf(msg.sender) >= amountB,
                "Insufficient balance for tokenB"
            );
            tokenB.transferFrom(msg.sender, address(this), amountB);
            pool.tokenBReserves += amountB;

            liquidityBProvided[msg.sender] += amountB;
        }

        // Emit event
        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    // Return liquidity provided by a user in both tokenA and tokenB
    function getUserLiquidity(
        address user
    ) external view returns (uint256 userTokenA, uint256 userTokenB) {
        userTokenA = liquidityAProvided[user];
        userTokenB = liquidityBProvided[user];
    }

    // Swap tokens in the pool
    function swapAtoB(uint256 amountAIn) external {
        require(amountAIn > 0, "Amount must be greater than 0");

        uint256 amountBOut = getAmountOut(
            amountAIn,
            pool.tokenAReserves,
            pool.tokenBReserves
        );

        uint256 fee = (amountBOut *
            (pool.tokenAReserves / pool.tokenBReserves)) / 1000; // Adjust fee dynamically
        amountBOut -= fee;

        tokenA.transferFrom(msg.sender, address(this), amountAIn);
        tokenB.transfer(msg.sender, amountBOut);

        pool.tokenAReserves += amountAIn;
        pool.tokenBReserves -= amountBOut;

        emit Swap(msg.sender, amountAIn, amountBOut);
    }

    function swapBtoA(uint256 amountBIn) external {
        require(amountBIn > 0, "Amount must be greater than 0");

        uint256 amountAOut = getAmountOut(
            amountBIn,
            pool.tokenBReserves,
            pool.tokenAReserves
        );

        uint256 fee = (amountAOut *
            (pool.tokenBReserves / pool.tokenAReserves)) / 1000; // Adjust fee dynamically
        amountAOut -= fee;

        tokenB.transferFrom(msg.sender, address(this), amountBIn);
        tokenA.transfer(msg.sender, amountAOut);

        pool.tokenBReserves += amountBIn;
        pool.tokenAReserves -= amountAOut;

        emit Swap(msg.sender, amountBIn, amountAOut);
    }

    // Calculate amount out based on input and reserves
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee applied
        return
            (amountInWithFee * reserveOut) /
            (reserveIn * 1000 + amountInWithFee);
    }

    // Claim accumulated rewards
    function claimRewards() external {
        uint256 rewards = calculateRewards(msg.sender);
        lastClaimedBlock[msg.sender] = block.number;
        rewardToken.mint(msg.sender, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }

    // Calculate rewards based on contribution over time
    function calculateRewards(address user) public view returns (uint256) {
        uint256 blocks = block.number - lastClaimedBlock[user];
        uint256 x = liquidityAProvided[user];
        uint256 y = liquidityBProvided[user];
        return blocks * rewardRate * (((x * y) / (x + y)));
    }

    // Adjust dynamic fee based on user-triggered liquidity changes
    function adjustDynamicFee() internal {
        if (pool.tokenAReserves / pool.tokenBReserves > 1) {
            dynamicFee = pool.tokenAReserves / pool.tokenBReserves; // Increase fee when liquidity is low
        } else if (pool.tokenBReserves / pool.tokenAReserves > 1) {
            dynamicFee = pool.tokenBReserves / pool.tokenAReserves; // Increase fee when liquidity is low
        } else {
            dynamicFee = 2; // Lower fee at higher liquidity
        }
    }
}
