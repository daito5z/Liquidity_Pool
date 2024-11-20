// deployRewardToken.js
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    // console.log("Deploying contracts with the account:", deployer.address);

    // Get the RewardToken contract factory
    const RewardToken = await hre.ethers.getContractFactory("RewardToken");

    // Deploy the RewardToken contract with the initial supply
    const rewardToken = await RewardToken.deploy();

    // await rewardToken.deployed();

    console.log("RewardToken deployed to:", rewardToken.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
