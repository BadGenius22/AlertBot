// src/bot.ts
import { ethers } from "ethers";
import {
  RPC,
  VAULT,
  MARKET,
  USDC,
  DEPOSITOR,
  TARGET_AMOUNT_DEC,
  ASSET_DECIMALS,
  POLL_INTERVAL_MS,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  WATCH_WALLET,
  SPAM_INTERVAL_SEC,
  ONE_SHOT,
} from "./config.js";
import { delay, toHuman } from "./utils.js";

const erc20Abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const vaultAbi = [
  "function maxWithdraw(address owner) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
];

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegram(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[telegram] missing token/chat -", text);
    return;
  }
  try {
    // node >=18 has fetch; this uses the global fetch
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.warn("[telegram] send failed:", e);
  }
}

export async function startBot() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const usdc = new ethers.Contract(USDC, erc20Abi, provider);
  const vault = new ethers.Contract(VAULT, vaultAbi, provider);

  const target = ethers.parseUnits(TARGET_AMOUNT_DEC, ASSET_DECIMALS);

  let spamTimer: NodeJS.Timeout | null = null;
  let lastAlertAt = 0;
  let alerted = false;
  let spamCount = 0;
  let lastTransferAmount = "";
  let lastTransferFrom = "";
  let lastTransferTo = "";
  const MAX_SPAM_COUNT = 5;

  async function checkAndNotify(source?: string) {
    try {
      // primary check - owner-aware
      let maxW: bigint = 0n;
      try {
        maxW = await vault.maxWithdraw(DEPOSITOR);
      } catch (e) {
        // some vaults may not accept the call; ignore and fallback
        maxW = 0n;
      }

      if (maxW >= target) {
        const human = toHuman(maxW, ASSET_DECIMALS);
        const text = `🚨 *Liquidity Available* 🚨\nVault: \`${VAULT}\`\nAvailable for your depositor: *${human} USDC*\nTrigger: ${
          source ?? "check"
        }\n\nWithdraw quickly: call \`withdraw(...)\` from your depositor EOA.`;
        await sendAndSpam(text);
        return true;
      }

      // fallback: check raw token balance in vault
      const vaultBal = await usdc.balanceOf(VAULT);
      if (vaultBal >= target) {
        const human = toHuman(vaultBal, ASSET_DECIMALS);
        const text = `🚨 *Liquidity Available (vault balance)* 🚨\nVault: \`${VAULT}\`\nVault USDC balance: *${human} USDC*\n(But confirm maxWithdraw(owner) before withdrawing)\nTrigger: ${
          source ?? "check"
        }`;
        await sendAndSpam(text);
        return true;
      }

      // no threshold hit
      return false;
    } catch (e) {
      console.warn("[bot] check error:", e);
      return false;
    }
  }

  async function sendAndSpam(
    message: string,
    transferAmount?: string,
    transferFrom?: string,
    transferTo?: string
  ) {
    const now = Date.now();
    if (now - lastAlertAt < 2000 && alerted) return; // prevent immediate double-send
    lastAlertAt = now;
    alerted = true;

    // Store transfer details for spam reminders
    if (transferAmount) {
      lastTransferAmount = transferAmount;
      lastTransferFrom = transferFrom || "";
      lastTransferTo = transferTo || "";
    }

    await sendTelegram(message);

    if (ONE_SHOT) {
      console.log("[bot] ONE_SHOT set -> exiting after first alert");
      process.exit(0);
    }

    // start spam timer if not already
    if (spamTimer) return;
    spamCount = 0; // Reset spam counter when new alert triggers
    spamTimer = setInterval(async () => {
      spamCount++;
      if (spamCount > MAX_SPAM_COUNT) {
        console.log(
          `[bot] Reached max spam count (${MAX_SPAM_COUNT}), stopping spam timer`
        );
        if (spamTimer) {
          clearInterval(spamTimer);
          spamTimer = null;
        }
        return;
      }
      console.log(
        `[bot] spam alert repeating... (${spamCount}/${MAX_SPAM_COUNT})`
      );

      // Include transfer amount in reminder if available
      const reminderText = lastTransferAmount
        ? `⏰ _Reminder_: Transfer detected - Amount: _${lastTransferAmount} USDC_ | From: \`${lastTransferFrom}\` | To: \`${lastTransferTo}\``
        : `⏰ _Reminder_: Transfer detected for vault \`${VAULT}\` or market \`${
            MARKET || "N/A"
          }\`. Check for available liquidity.`;

      await sendTelegram(reminderText);
    }, SPAM_INTERVAL_SEC * 1000);
  }

  // watch USDC Transfer events to the market and vault (instant)
  // Priority: Market first, then vault
  // Sends alert immediately when transfer is detected (only if amount > $10)
  const MIN_TRANSFER_AMOUNT = ethers.parseUnits("10", ASSET_DECIMALS); // $10 USDC minimum

  usdc.on(
    "Transfer",
    async (from: string, to: string, value: bigint, evt: any) => {
      try {
        const toLower = to?.toLowerCase();
        const human = toHuman(value, ASSET_DECIMALS);

        // Skip if transfer amount is <= $10
        if (value <= MIN_TRANSFER_AMOUNT) {
          return;
        }

        // Priority 1: Check if transfer is to market (checked first)
        if (MARKET && toLower === MARKET.toLowerCase()) {
          const source = `Transfer from ${from} → market (${human} USDC)`;
          console.log("[event] Transfer to market:", source);

          // Send alert immediately with transfer amount (with spam timer)
          const alertText = `🚨 _Transfer Detected_ 🚨\nMarket Contract: \`${MARKET}\`\nAmount: _${human} USDC_\nFrom: \`${from}\`\nTrigger: Transfer event`;
          await sendAndSpam(`_ALERT_\n${alertText}`, human, from, MARKET);
          return; // Exit early if market transfer detected
        }

        // Priority 2: Check if transfer is to vault
        if (toLower === VAULT.toLowerCase()) {
          const source = `Transfer from ${from} → vault (${human} USDC)`;
          console.log("[event] Transfer to vault:", source);

          // Send alert immediately with transfer amount (with spam timer)
          const alertText = `🚨 _Transfer Detected_ 🚨\nVault: \`${VAULT}\`\nAmount: _${human} USDC_\nFrom: \`${from}\`\nTrigger: Transfer event`;
          await sendAndSpam(`_ALERT_\n${alertText}`, human, from, VAULT);
        }

        // also watch specific wallet activity (to vault/market or general)
        if (from && from.toLowerCase() === WATCH_WALLET.toLowerCase()) {
          const text = `🔔 Wallet ${WATCH_WALLET} transferred ${human} USDC (from: ${from})`;
          await sendTelegram(text);
        }
      } catch (e) {
        console.warn("[bot:event] handler error:", e);
      }
    }
  );

  // main polling loop as backup
  console.log("[bot] started. Poll interval:", POLL_INTERVAL_MS, "ms");
  while (true) {
    try {
      const hit = await checkAndNotify("poll");
      if (hit && ONE_SHOT) {
        console.log("[bot] hit threshold and ONE_SHOT requested -> exiting");
        process.exit(0);
      }
    } catch (e) {
      console.warn("[bot] loop error:", e);
    }
    await delay(POLL_INTERVAL_MS);
  }
}
