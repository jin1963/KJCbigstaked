// abi.js

// ABI ของสัญญา Staking
const stakingABI = [
  { "inputs":[{"internalType":"address","name":"_kjcToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor" },
  { "inputs":[],"name":"CLAIM_INTERVAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"REWARD_RATE_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"SECONDS_IN_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getStakeCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"kjcToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function" },
  { "inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"pendingReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"tierDays","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"stakes","outputs":[
    {"internalType":"uint256","name":"amount","type":"uint256"},
    {"internalType":"uint256","name":"startTime","type":"uint256"},
    {"internalType":"uint256","name":"lockPeriod","type":"uint256"},
    {"internalType":"uint256","name":"lastClaimTime","type":"uint256"},
    {"internalType":"bool","name":"claimed","type":"bool"}],"stateMutability":"view","type":"function" },
  { "inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function" }
];

// ABI ของ KJC Token (ERC20 มาตรฐาน)
const erc20ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "success", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "remaining", "type": "uint256"}],
    "type": "function"
  }
];
