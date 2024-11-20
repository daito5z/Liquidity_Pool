import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import './App.css';
import AMMDEX_ABI from './abis/AMMDEX';
import TOKENA_ABI from './abis/TokenA';
import TOKENB_ABI from './abis/TokenB';
import REWARDTOKEN_ABI from './abis/RewardToken';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [ammDex, setAmmDex] = useState(null);
  const [tokenA, setTokenA] = useState(null);
  const [tokenB, setTokenB] = useState(null);
  const [rewardToken, setRewardToken] = useState(null);
  const [tokenABalance, setTokenABalance] = useState('0');
  const [tokenBBalance, setTokenBBalance] = useState('0');
  const [rewardTokenBalance, setRewardTokenBalance] = useState('0');
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [swapDirection, setSwapDirection] = useState('AtoB'); // Default swap direction
  const [userTKALiquidity, setUserTKALiquidity] = useState('0');
  const [userTKBLiquidity, setUserTKBLiquidity] = useState('0');
  const [poolLiquidity, setPoolLiquidity] = useState({ tokenA: '0', tokenB: '0' });


  const AMMDEX_ADDRESS = "0x0cd9f191B918DD2c6b9521ce9e495C6c018E87ce"; // Replace with actual AMMDEX contract address
  const TOKEN_A_ADDRESS = "0x3FcaAeb1Ec87f435349Bd1ADe7Faf9C1BDca9cB4"; // Replace with actual TokenA address
  const TOKEN_B_ADDRESS = "0x16278A5fB4776248dCe6836da29BaF989273a0CB"; // Replace with actual TokenB address
  const REWARD_TOKEN_ADDRESS = "0x82D1277a9ADaAbCe743BFaE9c0D459D902b4dAEB"; // Replace with actual RewardToken address

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        const provider = new Web3Provider(window.ethereum);
        setProvider(provider);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = provider.getSigner();
        const userAccount = await signer.getAddress();
        setAccount(userAccount);

        const ammDexContract = new ethers.Contract(AMMDEX_ADDRESS, AMMDEX_ABI, signer);
        const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, TOKENA_ABI, signer);
        const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, TOKENB_ABI, signer);
        const rewardTokenContract = new ethers.Contract(REWARD_TOKEN_ADDRESS, REWARDTOKEN_ABI, signer);

        setAmmDex(ammDexContract);
        setTokenA(tokenAContract);
        setTokenB(tokenBContract);
        setRewardToken(rewardTokenContract);

        // Fetch initial balances
        await fetchBalances(tokenAContract, tokenBContract, rewardTokenContract, userAccount);
      }
    };
    connectWallet();
  }, []);

  useEffect(() => {
    if (ammDex && account) {
      fetchLiquidityData();
    }
  }, [ammDex, account]);

  const handleTransactionCompletion = async () => {
    await fetchBalances(tokenA, tokenB, rewardToken, account);
    await fetchLiquidityData(); // Refresh liquidity data after transactions
  };


  const fetchBalances = async (tokenAContract, tokenBContract, rewardTokenContract, account) => {
    try {
      const tokenABalance = await tokenAContract.balanceOf(account);
      const tokenBBalance = await tokenBContract.balanceOf(account);
      const rewardTokenBalance = await rewardTokenContract.balanceOf(account);

      setTokenABalance(ethers.formatUnits(tokenABalance, 18));
      setTokenBBalance(ethers.formatUnits(tokenBBalance, 18));
      setRewardTokenBalance(ethers.formatUnits(rewardTokenBalance, 18));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const swapTokens = async () => {
    if (!ammDex || !tokenA || !tokenB || !account) return;
    setTransactionInProgress(true);
    try {
      const swapAmountInWei = ethers.parseUnits(swapAmount, 18);

      if (swapDirection === 'AtoB') {
        // Swap from TokenA to TokenB
        await tokenA.approve(AMMDEX_ADDRESS, swapAmountInWei);
        const tx = await ammDex.swapAtoB(swapAmountInWei, { gasLimit: 1000000 }); // Assuming swapAtoB function exists in the AMMDEX contract
        console.log(12);
        await tx.wait();
      } else if (swapDirection === 'BtoA') {
        // Swap from TokenB to TokenA
        await tokenB.approve(AMMDEX_ADDRESS, swapAmountInWei);
        const tx = await ammDex.swapBtoA(swapAmountInWei, { gasLimit: 1000000 }); // Assuming swapBtoA function exists in the AMMDEX contract
        console.log(123);
        await tx.wait();
      }
      alert('Swap successful!');
      await handleTransactionCompletion(); // Refresh balances after swap
    } catch (error) {
      console.error('Error swapping tokens:', error);
      alert('Error swapping tokens');
    }
    setTransactionInProgress(false);
  };

  const addLiquidity = async () => {
    if (!ammDex || !tokenA || !tokenB || !account) return;
    setTransactionInProgress(true);
    try {
      const tokenAAmountInWei = ethers.parseUnits(tokenAAmount, 18);
      const tokenBAmountInWei = ethers.parseUnits(tokenBAmount, 18);

      await tokenA.approve(AMMDEX_ADDRESS, tokenAAmountInWei);
      await tokenB.approve(AMMDEX_ADDRESS, tokenBAmountInWei);

      console.log(tokenAAmountInWei);
      console.log(tokenBAmountInWei);

      const tx = await ammDex.addLiquidity(tokenAAmountInWei, tokenBAmountInWei, { gasLimit: 1000000 });
      console.log(22);
      await tx.wait();
      alert('Liquidity added successfully!');
    } catch (error) {
      console.error('Error adding liquidity:', error);
      alert('Error adding liquidity');
    }
    setTransactionInProgress(false);
  };

  const fetchLiquidityData = async () => {
    if (!ammDex || !account) return;

    try {
      const [userTokenA, userTokenB] = await ammDex.getUserLiquidity(account);
      setUserTKALiquidity(ethers.formatUnits(userTokenA, 18));
      setUserTKBLiquidity(ethers.formatUnits(userTokenB, 18));

      // Fetch pool-wide liquidity for Token A and Token B
      const poolData = await ammDex.pool();
      setPoolLiquidity({
        tokenA: ethers.formatUnits(poolData.tokenAReserves, 18),
        tokenB: ethers.formatUnits(poolData.tokenBReserves, 18),
      });
    } catch (error) {
      console.error('Error fetching liquidity data:', error);
    }
  };


  const purchaseTokenAWithWei = async () => {
    if (!tokenA || !account) return;
    setTransactionInProgress(true);
    try {
      const valueInWei = ethers.parseUnits(tokenAAmount, 'wei'); // Ensure proper scaling
      const tx = await tokenA.buyWithETH({ value: valueInWei, gasLimit: 1000000 });

      // Wait for transaction confirmation
      await tx.wait(); // Wait for at least 1 confirmation (default)

      alert('TokenA purchased successfully with Wei!');
    } catch (error) {
      console.error('Error purchasing TokenA with Wei:', error);
      alert('Error purchasing TokenA with Wei');
    }
    setTransactionInProgress(false);
  };

  const purchaseTokenAWithRewardTokens = async () => {
    if (!tokenA || !rewardToken || !account) return;
    setTransactionInProgress(true);
    try {
      const rewardAmountInWei = ethers.parseUnits(rewardAmount, 18);
      await rewardToken.approve(TOKEN_A_ADDRESS, rewardAmountInWei);
      const tx = await tokenA.buyWithRewardTokens(rewardAmountInWei, { gasLimit: 1000000 });
      await tx.wait();
      alert('TokenA purchased successfully with Reward Tokens!');
    } catch (error) {
      console.error('Error purchasing TokenA with Reward Tokens:', error);
      alert('Error purchasing TokenA with Reward Tokens');
    }
    setTransactionInProgress(false);
  };

  const claimRewards = async () => {
    if (!ammDex || !account) return;
    setTransactionInProgress(true);
    try {
      console.log(12);
      const tx = await ammDex.claimRewards({ gasLimit: 1000000 });
      console.log(125);
      await tx.wait();
      alert('Rewards claimed successfully!');
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Error claiming rewards');
    }
    setTransactionInProgress(false);
  };

  return (
    <div className="App">
      <h1>DeFi DApp</h1>
      {!account ? (
        <button onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}>Connect Wallet</button>
      ) : (
        <>
          <div>
            <h3>Wallet Address: {account}</h3>
            <p>TokenA Balance: {tokenABalance}</p>
            <p>TokenB Balance: {tokenBBalance}</p>
            <p>RewardToken Balance: {rewardTokenBalance}</p>
          </div>

          <div>
            <h3>Purchase TokenA</h3>
            <div>
              <label>1 TokenA = 1 wei</label>
              <input
                type="number"
                value={tokenAAmount}
                onChange={(e) => setTokenAAmount(e.target.value)}
                placeholder="Amount of TokenA"
              />
              <button onClick={purchaseTokenAWithWei} disabled={transactionInProgress}>
                {transactionInProgress ? 'Processing...' : 'Purchase with Wei'}
              </button>
            </div>
            <div>
              <label>1 TokenA = 100 Reward Token</label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="Amount of Reward Tokens"
              />
              <button onClick={purchaseTokenAWithRewardTokens} disabled={transactionInProgress}>
                {transactionInProgress ? 'Processing...' : 'Purchase with Reward Tokens'}
              </button>
            </div>
          </div>

          <div>
            <h3>Swap Tokens</h3>
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="Amount to Swap"
            />
            <select value={swapDirection} onChange={(e) => setSwapDirection(e.target.value)}>
              <option value="AtoB">TokenA to TokenB</option>
              <option value="BtoA">TokenB to TokenA</option>
            </select>
            <p>TokenA to TokenB Transaction Fee: {((poolLiquidity.tokenA / poolLiquidity.tokenB) / 10).toFixed(2)}%</p>
            <p>TokenB to TokenA Transaction Fee: {((poolLiquidity.tokenB / poolLiquidity.tokenA) / 10).toFixed(2)}%</p>
            <button onClick={swapTokens} disabled={transactionInProgress}>
              {transactionInProgress ? 'Processing...' : 'Swap Tokens'}
            </button>
          </div>

          <div>
            <h3>Add Liquidity</h3>
            <input
              type="number"
              value={tokenAAmount}
              onChange={(e) => setTokenAAmount(e.target.value)}
              placeholder="Amount of TokenA"
            />
            <input
              type="number"
              value={tokenBAmount}
              onChange={(e) => setTokenBAmount(e.target.value)}
              placeholder="Amount of TokenB"
            />
            <button onClick={addLiquidity} disabled={transactionInProgress}>
              {transactionInProgress ? 'Processing...' : 'Add Liquidity'}
            </button>
          </div>

          <div>
            <h3>Liquidity Information</h3>
            <h4>Liquidity provided by User:</h4>
            <p>TokenA: {userTKALiquidity}</p>
            <p>TokenB: {userTKBLiquidity}</p>
            <h4>Total Pool Liquidity:</h4>
            <p>TokenA: {poolLiquidity.tokenA}</p>
            <p>TokenB: {poolLiquidity.tokenB}</p>
          </div>


          <div>
            <h3>Claim Rewards</h3>
            <button onClick={claimRewards} disabled={transactionInProgress}>
              {transactionInProgress ? 'Processing...' : 'Claim Rewards'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

