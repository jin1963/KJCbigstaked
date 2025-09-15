// main.js

let web3;
let contract;
let token;
let user;
let provider;

async function initWeb3() {
  provider = window.ethereum || window.bitkeep?.ethereum || window.okxwallet?.ethereum;

  if (!provider) {
    alert("⚠️ ไม่พบ Web3 provider\nกรุณาเปิดหน้านี้จากแอป MetaMask หรือ Bitget Wallet เท่านั้น");
    return;
  }

  web3 = new Web3(provider);
  token = new web3.eth.Contract(erc20ABI, tokenAddress);
  contract = new web3.eth.Contract(stakingABI, contractAddress);

  provider.on('accountsChanged', () => window.location.reload());
  provider.on('chainChanged', () => window.location.reload());

  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("stakeButton").addEventListener("click", stakeTokens);
}

window.addEventListener("load", initWeb3);

async function connectWallet() {
  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    user = accounts[0];

    const currentChainId = await provider.request({ method: "eth_chainId" });
    if (parseInt(currentChainId, 16) !== chainId) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }]
      });
    }

    document.getElementById("status").innerHTML = `✅ Connected:<br>${user}`;
    loadStakes();
  } catch (err) {
    console.error("Connection failed:", err);
    alert("❌ Wallet connection failed: " + err.message);
    document.getElementById("status").innerText = "❌ Connection failed.";
  }
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  const tier = document.getElementById("stakeTier").value;
  if (!amount || amount <= 0) return alert("Enter amount to stake");

  const decimals = await token.methods.decimals().call();
  const stakeAmount = web3.utils.toBN(amount * (10 ** decimals));

  try {
    await token.methods.approve(contractAddress, stakeAmount).send({ from: user });
    await contract.methods.stake(stakeAmount, tier).send({ from: user });

    alert("✅ Staked successfully");
    loadStakes();
  } catch (error) {
    console.error("Staking failed:", error);
    alert("❌ Staking failed: " + error.message);
  }
}

async function loadStakes() {
  const container = document.getElementById("stakesContainer");
  container.innerHTML = "";

  let index = 0;
  while (true) {
    try {
      const stake = await contract.methods.stakes(user, index).call();
      if (stake.amount == 0) break;

      const now = Math.floor(Date.now() / 1000);
      const amount = web3.utils.fromWei(stake.amount, "ether");

      const startTimestamp = Number(stake.startTime);
      const unlockTimestamp = Number(stake.startTime) + Number(stake.lockPeriod);

      const start = startTimestamp > 0
        ? new Date(startTimestamp * 1000).toLocaleDateString("th-TH")
        : "-";

      const unlock = unlockTimestamp > 0
        ? new Date(unlockTimestamp * 1000).toLocaleDateString("th-TH")
        : "-";

      const card = document.createElement("div");
      card.className = "stake-item";
      card.innerHTML = `
        <p><strong>Amount:</strong> ${amount} KJC</p>
        <p><strong>Start:</strong> ${start}</p>
        <p><strong>Unlock:</strong> ${unlock}</p>
        <p><strong>Status:</strong> ${stake.claimed ? "✅ Claimed" : "🔒 Locked"}</p>
      `;

      const claimable = now - stake.lastClaimTime >= 15 * 86400;
      const canUnstake = now >= unlockTimestamp;

      if (!stake.claimed && claimable) {
        const claimBtn = document.createElement("button");
        claimBtn.innerText = "Claim Reward";
        claimBtn.onclick = async () => {
          await contract.methods.claim(index).send({ from: user });
          alert("✅ Claimed");
          loadStakes();
        };
        card.appendChild(claimBtn);
      }

      if (!stake.claimed && canUnstake) {
        const unstakeBtn = document.createElement("button");
        unstakeBtn.innerText = "Unstake";
        unstakeBtn.onclick = async () => {
          await contract.methods.unstake(index).send({ from: user });
          alert("✅ Unstaked");
          loadStakes();
        };
        card.appendChild(unstakeBtn);
      }

      container.appendChild(card);
      index++;
    } catch (e) {
      if (index === 0) container.innerText = "Failed to load stakes.";
      break;
    }
  }
}
