import { ethers } from "ethers";

const tokenAContractAddress = "0x1264BFA83CCc741759E935931E001a33AB223Ede"; // Replace with TokenA's actual contract address
const TokenA_ABI = [
    // Include the ABI of TokenA contract here
];

export const buyTokenA = async (provider, signer, amountInETH) => {
    try {
        const tokenAContract = new ethers.Contract(tokenAContractAddress, TokenA_ABI, signer);
        const ethAmount = ethers.parseUnits(amountInETH, 18); // Assuming TokenA uses 18 decimals
        const tx = await tokenAContract.buyTokenA({ value: ethAmount });
        await tx.wait();
        console.log("TokenA purchased successfully");
    } catch (error) {
        console.error("Error in buying TokenA:", error);
    }
};
