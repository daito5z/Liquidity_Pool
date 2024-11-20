const hre = require("hardhat");

async function main() {
    // Replace with the address of the reward token
    const rewardTokenAddress = "0x82D1277a9ADaAbCe743BFaE9c0D459D902b4dAEB";

    // We get the contract to deploy
    const TokenA = await hre.ethers.getContractFactory("TokenA");
    const tokenA = await TokenA.deploy(rewardTokenAddress);

    // await tokenA.deployed();

    console.log("TokenA deployed to:", tokenA.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
