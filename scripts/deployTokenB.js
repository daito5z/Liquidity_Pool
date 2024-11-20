// deployTokenB.js
const hre = require("hardhat");

async function main() {
    const initialSupply = 1000000; // Adjust the initial supply as needed

    const TokenB = await hre.ethers.getContractFactory("TokenB");

    // Pass initialSupply as an array
    const tokenB = await TokenB.deploy([initialSupply]);

    await tokenB.waitForDeployment();

    console.log("TokenB deployed to:", await tokenB.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
