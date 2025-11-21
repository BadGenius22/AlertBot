// scripts/test-bot-fork.ts
// Helper script to test the bot with Arbitrum fork
// Usage:
//   1. In one terminal: npm run anvil:fork
//   2. In another: npm run test:fork

import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const WHALE_ADDRESS = "0x35fd2113225fa9C6afB21268BAd915F3bEfa3d98";

const HARDHAT_RPC = "http://127.0.0.1:8545";
const VAULT = process.env.VAULT || "";
const TRANSFER_AMOUNT = "15000"; // 15k USDC

if (!VAULT) {
  console.error("Error: VAULT not set in .env");
  process.exit(1);
}

async function testBot() {
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);

  const erc20Abi = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  const usdc = new ethers.Contract(ARBITRUM_USDC, erc20Abi, provider);
  const decimals = await usdc.decimals();

  // Impersonate whale
  await provider.send("hardhat_impersonateAccount", [WHALE_ADDRESS]);
  const whaleSigner = await provider.getSigner(WHALE_ADDRESS);
  const usdcWithSigner = new ethers.Contract(
    ARBITRUM_USDC,
    erc20Abi,
    whaleSigner
  );

  // Check initial balance
  const initialBalance = await usdc.balanceOf(VAULT);
  console.log(
    `Initial vault balance: ${ethers.formatUnits(
      initialBalance,
      decimals
    )} USDC`
  );

  // Transfer USDC to vault
  const transferAmount = ethers.parseUnits(TRANSFER_AMOUNT, decimals);
  console.log(`Transferring ${TRANSFER_AMOUNT} USDC to vault ${VAULT}...`);

  const tx = await usdcWithSigner.transfer(VAULT, transferAmount);
  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();

  const newBalance = await usdc.balanceOf(VAULT);
  console.log(
    `New vault balance: ${ethers.formatUnits(newBalance, decimals)} USDC`
  );
  console.log(
    `✅ Transfer complete! The bot should detect this and send an alert.`
  );

  // Stop impersonating
  await provider.send("hardhat_stopImpersonatingAccount", [WHALE_ADDRESS]);
}

testBot().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
