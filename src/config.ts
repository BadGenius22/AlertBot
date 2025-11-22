// src/config.ts
import dotenv from "dotenv";
dotenv.config();

// For end-to-end testing with local Anvil node, set USE_LOCAL_NODE=true
export const RPC =
  process.env.USE_LOCAL_NODE === "true"
    ? "http://127.0.0.1:8545"
    : process.env.ARBITRUM_RPC || "";
export const VAULT = (process.env.VAULT || "").trim();
export const MARKET = (process.env.MARKET || "").trim();
export const USDC = (process.env.USDC || "").trim();
export const DEPOSITOR = (process.env.DEPOSITOR || "").trim();

export const TARGET_AMOUNT_DEC = process.env.TARGET_AMOUNT_DEC || "8000";
export const ASSET_DECIMALS = Number(process.env.ASSET_DECIMALS || "6");

export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 3600000); // 1 hour default
export const WATCH_WALLET = (process.env.WATCH_WALLET || "").trim();

export const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
export const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || "").trim();

export const SPAM_INTERVAL_SEC = Number(process.env.SPAM_INTERVAL_SEC || 10);
export const ONE_SHOT =
  (process.env.ONE_SHOT || "false").toLowerCase() === "true";

if (!RPC) throw new Error("Missing ARBITRUM_RPC in .env");
if (!VAULT) throw new Error("Missing VAULT in .env");
if (!USDC) throw new Error("Missing USDC in .env");
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn(
    "Warning: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Bot cannot send alerts until these are provided."
  );
}
