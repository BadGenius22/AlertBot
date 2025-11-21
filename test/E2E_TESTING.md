# End-to-End Testing Guide

This guide shows you how to test the bot end-to-end by simulating a whale transfer and verifying the bot sends an alert.

## Prerequisites

Make sure your `.env` file has:

- `ARBITRUM_RPC` - Your Arbitrum RPC URL
- `VAULT` - The vault address to monitor
- `USDC` - USDC contract address (default: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`)
- `TARGET_AMOUNT_DEC` - Threshold amount (default: `8000`)
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID

## Step-by-Step End-to-End Test

### Terminal 1: Start Anvil with Fork

```bash
npm run anvil:fork
```

This will:

- Start Anvil (Foundry) on `http://127.0.0.1:8545`
- Fork Arbitrum at the latest block
- Enable account impersonation
- **Note:** Anvil handles Arbitrum hardforks better than Hardhat 3's EDR

### Terminal 2: Start the Bot (Connected to Local Node)

```bash
# Set USE_LOCAL_NODE to connect bot to local Anvil node
USE_LOCAL_NODE=true npm start
```

The bot will:

- Connect to `http://127.0.0.1:8545` (local Anvil node)
- Start monitoring the vault
- Listen for Transfer events
- Poll for balance changes

### Terminal 3: Simulate Whale Transfer

```bash
npm run test:fork
```

This script will:

- Impersonate a whale account
- Transfer 15,000 USDC to your vault
- The bot should detect this and send a Telegram alert

## Expected Flow

1. **Anvil starts** - Forked Arbitrum network running locally
2. **Bot starts** - Connects to local node and begins monitoring
3. **Transfer script runs** - Whale transfers USDC to vault
4. **Bot detects transfer** - Event listener catches the Transfer event
5. **Bot checks balance** - Verifies vault balance >= target
6. **Bot sends alert** - Telegram message sent to your chat

## Verification

You should see:

- In Terminal 2 (Bot): `[event] Transfer to vault: Transfer from 0x... → vault (15000 USDC)`
- In Terminal 2 (Bot): Alert message being sent
- In Telegram: Alert message received

## Troubleshooting

### Bot doesn't detect transfer

- Make sure `USE_LOCAL_NODE=true` is set when starting the bot
- Verify Anvil is running on port 8545
- Check that `VAULT` in .env matches the vault address

### No Telegram alert

- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Check that the bot has permission to send messages
- Verify the vault balance is >= `TARGET_AMOUNT_DEC`

### Anvil connection issues

- Make sure port 8545 is not in use (use `npm run node:fork:kill` to kill existing process)
- Verify `ARBITRUM_RPC` is accessible
- Check that the fork is successful (look for block number in Anvil output)
- Make sure Foundry/Anvil is installed: `foundryup` or visit https://book.getfoundry.sh/getting-started/installation

## Cleanup

After testing:

1. Stop the bot (Ctrl+C in Terminal 2)
2. Stop Anvil (Ctrl+C in Terminal 1)
3. Unset `USE_LOCAL_NODE` for production use
