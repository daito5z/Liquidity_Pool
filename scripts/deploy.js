const hre = require("hardhat");

async function main() {
    // Define token addresses and reward rate for AMMDEX
    const rewardTokenAddress = "0x82D1277a9ADaAbCe743BFaE9c0D459D902b4dAEB"; // Replace with actual deployed RewardToken address
    const tokenAAddress = "0x3FcaAeb1Ec87f435349Bd1ADe7Faf9C1BDca9cB4"; // Replace with actual TokenA address
    const tokenBAddress = "0x16278A5fB4776248dCe6836da29BaF989273a0CB"; // Replace with actual TokenB address
    const rewardRate = 1; // Reward rate per block

    // Get the AMMDEX contract factory
    const AMMDEX = await hre.ethers.getContractFactory("AMMDEX");

    // Deploy the AMMDEX contract with specified token addresses and reward rate
    const ammDex = await AMMDEX.deploy(tokenAAddress, tokenBAddress, rewardTokenAddress, rewardRate);

    // Ensure deployment is complete
    // await ammDex.deployed();

    console.log("AMMDEX deployed to:", ammDex.target);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});