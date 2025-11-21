# AlertBot - Silo Vault Liquidity Monitor

A monitoring bot that detects and alerts when liquidity becomes available in Silo Vaults, specifically designed to monitor for drained liquidity recovery following the Stream Finance incident.

## Overview

This bot continuously monitors Silo Vault contracts on Arbitrum, detecting when sufficient liquidity becomes available for withdrawal. It uses real-time event listening combined with periodic polling to ensure reliable detection and sends instant Telegram alerts when thresholds are met.

## Features

- 🔔 **Real-time Event Detection** - Listens to USDC Transfer events for instant detection
- ⏱️ **Periodic Polling** - Backup checks every 5 minutes (configurable)
- 📱 **Telegram Alerts** - Sends formatted alerts to Telegram when liquidity threshold is met
- 🎯 **Dual Detection Methods**:
  - Primary: Checks `maxWithdraw(depositor)` for owner-aware withdrawal amounts
  - Fallback: Checks raw USDC balance in vault
- 🔄 **Auto-restart** - Designed for 24/7 operation with Railway or other cloud platforms
- ⚙️ **Configurable** - All parameters via environment variables

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Arbitrum RPC endpoint
- Telegram bot token and chat ID

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd AlertBot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env  # Create your .env file
```

### Configuration

Create a `.env` file with the following variables:

```env
# Required
ARBITRUM_RPC=your_arbitrum_rpc_url
VAULT=0x...your_vault_address
USDC=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
DEPOSITOR=0x...your_depositor_address
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Optional (with defaults)
TARGET_AMOUNT_DEC=8000          # Threshold in USDC (default: 8000)
ASSET_DECIMALS=6                # USDC decimals (default: 6)
POLL_INTERVAL_MS=300000         # Polling interval in ms (default: 5 minutes)
SPAM_INTERVAL_SEC=10            # Repeat alert interval (default: 10 seconds)
ONE_SHOT=false                  # Exit after first alert (default: false)
WATCH_WALLET=                   # Optional wallet to monitor
```

### Run Locally

```bash
npm start
```

### Run with Local Anvil Fork (for testing)

```bash
# Terminal 1: Start Anvil with Arbitrum fork
npm run anvil:fork

# Terminal 2: Start bot connected to local node
npm run start:local

# Terminal 3: Simulate whale transfer
npm run test:fork
```

## Deployment

### Railway (Recommended)

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

Quick steps:

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Add environment variables
5. Deploy!

### Other Options

- **VPS**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for VPS setup with PM2
- **Docker**: Use the included `Dockerfile` and `docker-compose.yml`

## How It Works

1. **Event Listener** (Primary):

   - Subscribes to USDC `Transfer` events
   - Instantly detects when USDC is transferred to the vault
   - Triggers immediate balance check and alert

2. **Polling Loop** (Backup):

   - Checks vault balance every 5 minutes (configurable)
   - Ensures detection even if event listener fails
   - Uses minimal RPC calls (~12 calls/hour)

3. **Alert Logic**:
   - Checks `maxWithdraw(depositor)` first (owner-aware)
   - Falls back to raw vault balance if needed
   - Sends Telegram alert when threshold is met
   - Optionally repeats alerts at configured intervals

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run bot-specific tests
npm run test:bot
```

### End-to-End Testing

See [test/E2E_TESTING.md](./test/E2E_TESTING.md) for complete E2E testing guide.

## Project Structure

```
AlertBot/
├── src/
│   ├── bot.ts          # Main bot logic
│   ├── config.ts       # Configuration loader
│   └── utils.ts        # Utility functions
├── scripts/
│   ├── run.ts          # Entry point
│   ├── test-bot-fork.ts    # E2E test script
│   └── start-anvil-fork.ts # Anvil fork helper
├── test/
│   ├── bot.test.ts     # Bot tests (viem)
│   └── Counter.ts      # Example tests
├── contracts/          # Solidity contracts
├── hardhat.config.ts   # Hardhat configuration
├── Dockerfile         # Docker configuration
└── RAILWAY_DEPLOYMENT.md  # Railway deployment guide
```

## Monitoring

The bot logs important events:

- `[bot] started. Poll interval: 300000 ms`
- `[event] Transfer to vault: Transfer from 0x... → vault (15000 USDC)`
- `[telegram] missing token/chat - ...` (if Telegram not configured)

## Cost Optimization

With 5-minute polling:

- **RPC Calls**: ~12 calls/hour (~288/day)
- **Cloud Costs**: ~$5-10/month on Railway
- **Fits within**: Most free RPC tiers

## Troubleshooting

### Bot not detecting transfers

- Verify `VAULT` address is correct
- Check RPC endpoint is accessible
- Ensure event listener is working (check logs)

### No Telegram alerts

- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Check bot has permission to send messages
- Verify vault balance >= `TARGET_AMOUNT_DEC`

### High RPC usage

- Increase `POLL_INTERVAL_MS` (default: 5 minutes)
- Event listener uses minimal calls (only on transfers)
