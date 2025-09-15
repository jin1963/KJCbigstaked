// === main.js ===

let web3;
let provider;
let user;

let token;     // ERC20(KJC)
let contract;  // Staking

// ===== helpers =====
const toBigInt = (v) => BigInt(v.toString());

function toUnits(amountFloat, decimals) {
  // แปลง "1500.123" -> BigInt ตามทศนิยมโทเคน
  const s = String(amountFloat);
  const [i, f = ""] = s.split(".");
  const di = toBigInt(i || "0") * (10n ** BigInt(decimals));
  const frac = (f ? toBigInt((f + "0".repeat(decimals)).slice(0, decimals)) : 0n);
  return (di + frac).toString();
}

function formatUnits(bnStr, decimals, precision = 6) {
  const bn = toBigInt(bnStr);
  const base = 10n ** BigInt(decimals);
  const i = (bn / base).toString();
  let d = (bn % base).toString().padStart(decimals, "0");
  if (decimals === 0) return i;
  if (precision >= 0) d = d.slice(0, precision);
  d = d.replace(/0+$/, "");
  return d ? `${i}.${d}` : i;
}

function shortAddr(a) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

// ===== init =====
async function initWeb3() {
  provider = window.ethereum
          || window.bitkeep?.ethereum
          || window.okxwallet?.ethereum
          || window.bitget?.ethereum;

  if (!provider) {
    alert("⚠️ ไม่พบ Web3 provider\nโปรดเปิดด้วย MetaMask/Bitget Wallet");
    return;
  }

  web3 = new Web3(provider);
  // ใช้ตัวแปรจาก config.js และ abi.js
  token    = new web3.eth.Contract(erc20ABI, tokenAddress);
  contract = new web3.eth.Contract(stakingABI, contractAddress);

  // events
  provider.on?.('accountsChanged', () => location.reload());
  provider.on?.('chainChanged',   () => location.reload());

  // UI hooks
  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("stakeButton").addEventListener("click", stakeTokens);
}

window.addEventListener("load", initWeb3);

// ===== connect =====
async function connectWallet() {
  try {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    user = accounts[0];

    const currentChain = await provider.request({ method: "eth_chainId" });
    if (parseInt(currentChain, 16) !== chainId) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + chainId.toString(16) }],
      });
    }

    document.getElementById("status").innerHTML = `✅ Connected:<br>${user}`;
    await loadStakes();
  } catch (err) {
    console.error("Connection failed:", err);
    alert("❌ Wallet connection failed: " + (err.message || err));
    document.getElementById("status").innerText = "❌ Connection failed.";
  }
}

// ===== staking flow =====
async function stakeTokens() {
  if (!user) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");

  const raw = document.getElementById("stakeAmount").value.trim();
  const tierDays = Number(document.getElementById("stakeTier").value || "0");
  if (!raw || Number(raw) <= 0) return alert("กรุณากรอกจำนวนที่จะ stake");

  try {
    const decimals = await token.methods.decimals().call();
    const amountWei = toUnits(raw, Number(decimals));

    // 1) ตรวจ allowance ก่อน
    const allowance = await token.methods.allowance(user, contractAddress).call();
    if (toBigInt(allowance) < toBigInt(amountWei)) {
      // ขออนุมัติเท่าที่ต้องใช้ (หรือจะ MAX ก็ได้)
      await token.methods.approve(contractAddress, amountWei).send({ from: user });
      alert("✅ Approved KJC แล้ว กด Stake อีกครั้งเพื่อยืนยันการ Stake");
      return; // ให้ผู้ใช้กด Stake ใหม่รอบสอง
    }

    // 2) ส่งธุรกรรม stake
    await contract.methods.stake(amountWei, tierDays).send({ from: user });
    alert("✅ Staked successfully");
    await loadStakes();
  } catch (error) {
    console.error("Staking failed:", error);
    const msg = error?.message || String(error);
    alert("❌ Staking failed: " + msg);
  }
}

// ===== load stakes =====
async function loadStakes() {
  const box = document.getElementById("stakesContainer");
  box.innerHTML = "";

  if (!user) {
    box.innerText = "กรุณาเชื่อมต่อกระเป๋า";
    return;
  }

  try {
    // ลองใช้ getStakeCount ถ้ามี
    let count = 0;
    if (contract.methods.getStakeCount) {
      try {
        count = Number(await contract.methods.getStakeCount(user).call());
      } catch {
        count = 0;
      }
    }

    let items = [];

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const s = await contract.methods.stakes(user, i).call();
        items.push({ ...s, index: i });
      }
    } else {
      // fallback: ไล่ index จนเจอ error/amount==0
      for (let i = 0; i < 500; i++) {
        try {
          const s = await contract.methods.stakes(user, i).call();
          if (!s || toBigInt(s.amount) === 0n) break;
          items.push({ ...s, index: i });
        } catch {
          break;
        }
      }
    }

    if (items.length === 0) {
      box.innerText = "ยังไม่มีรายการ stake";
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const kjcDecimals = Number(await token.methods.decimals().call());

    for (const s of items) {
      const amountDisp = formatUnits(s.amount, kjcDecimals, 6);
      const startTs = Number(s.startTime);
      const unlockTs = Number(s.startTime) + Number(s.lockPeriod);
      const lastClaimTs = Number(s.lastClaimTime);

      const startStr  = startTs   ? new Date(startTs * 1000).toLocaleString() : "-";
      const unlockStr = unlockTs  ? new Date(unlockTs * 1000).toLocaleString() : "-";

      // อ่านรางวัลที่เคลมได้ (ถ้ามีฟังก์ชัน)
      let pending = "0";
      if (contract.methods.pendingReward) {
        try {
          const p = await contract.methods.pendingReward(user, s.index).call();
          pending = formatUnits(p, kjcDecimals, 6);
        } catch {}
      }

      const card = document.createElement("div");
      card.className = "stake-item";
      card.innerHTML = `
        <p><strong>Index:</strong> ${s.index}</p>
        <p><strong>Amount:</strong> ${amountDisp} KJC</p>
        <p><strong>Start:</strong> ${startStr}</p>
        <p><strong>Unlock:</strong> ${unlockStr}</p>
        <p><strong>Pending Reward:</strong> ${pending} KJC</p>
        <p><strong>Status:</strong> ${s.claimed ? "✅ Claimed" : (now >= unlockTs ? "🔓 Unlockable" : "🔒 Locked")}</p>
      `;

      // claim ปล่อยทุก 15 วันตาม CLAIM_INTERVAL
      let claimable = false;
      try {
        const interval = Number(await contract.methods.CLAIM_INTERVAL().call());
        claimable = (now - lastClaimTs) >= interval;
      } catch {
        // ถ้าอ่านไม่ได้ ให้เดาว่า 15 วัน
        claimable = (now - lastClaimTs) >= (15 * 86400);
      }

      if (!s.claimed && claimable) {
        const btn = document.createElement("button");
        btn.textContent = "Claim Reward";
        btn.onclick = async () => {
          try {
            await contract.methods.claim(s.index).send({ from: user });
            alert("✅ Claimed");
            await loadStakes();
          } catch (e) {
            alert("❌ Claim failed: " + (e?.message || e));
          }
        };
        card.appendChild(btn);
      }

      if (!s.claimed && now >= unlockTs) {
        const btnU = document.createElement("button");
        btnU.textContent = "Unstake";
        btnU.onclick = async () => {
          try {
            await contract.methods.unstake(s.index).send({ from: user });
            alert("✅ Unstaked");
            await loadStakes();
          } catch (e) {
            alert("❌ Unstake failed: " + (e?.message || e));
          }
        };
        card.appendChild(btnU);
      }

      box.appendChild(card);
    }
  } catch (e) {
    console.error(e);
    document.getElementById("stakesContainer").innerText = "Failed to load stakes.";
  }
}
