# Railway Deployment Guide

This guide shows you how to deploy AlertBot to Railway for 24/7 operation.

## What Railway Needs

✅ **Keep:**

- `package.json` - Railway uses this to detect Node.js
- `Dockerfile` - Optional, but useful if you want Docker deployment
- `docker-compose.yml` - Optional, for local testing
- `.env` - You'll add these as Railway environment variables

❌ **Removed:**

- `ecosystem.config.cjs` - PM2 not needed (Railway manages processes)
- PM2 scripts - Not needed on Railway

## Step-by-Step Deployment

### Step 1: Prepare Your Code

1. Make sure your code is pushed to GitHub
2. Ensure `.env` is in `.gitignore` (it should be)

### Step 2: Sign Up for Railway

1. Go to https://railway.app
2. Sign up with your GitHub account
3. You'll get $5 free credit to start

### Step 3: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your **AlertBot** repository

### Step 4: Configure Environment Variables

1. Click on your service
2. Go to **"Variables"** tab
3. Add all your environment variables:

```
ARBITRUM_RPC=your_rpc_url
VAULT=your_vault_address
USDC=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
DEPOSITOR=your_depositor_address
TARGET_AMOUNT_DEC=8000
ASSET_DECIMALS=6
POLL_INTERVAL_MS=300000
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
SPAM_INTERVAL_SEC=10
ONE_SHOT=false
WATCH_WALLET=optional_wallet_address
```

4. Railway will automatically redeploy when you add variables

### Step 5: Verify Deployment

1. Go to **"Deployments"** tab
2. Wait for build to complete (usually 1-2 minutes)
3. Check **"Logs"** tab to see bot output
4. You should see: `[bot] started. Poll interval: 300000 ms`

### Step 6: Monitor Your Bot

- **Logs**: Click "Logs" tab to see real-time output
- **Metrics**: Railway shows CPU, memory usage
- **Deployments**: See deployment history

## Railway Auto-Detection

Railway will automatically:

- ✅ Detect Node.js from `package.json`
- ✅ Run `npm install` to install dependencies
- ✅ Run `npm start` to start your bot
- ✅ Keep it running 24/7
- ✅ Restart if it crashes
- ✅ Scale based on usage

## Optional: Use Docker

If you prefer Docker deployment:

1. Railway will auto-detect `Dockerfile`
2. It will build and run using Docker
3. Same result, just containerized

## Cost Estimate

With your bot's current setup (5-minute polling):

- **Compute**: ~$5-10/month (usage-based)
- **Free tier**: $5 credit/month (covers most bots)
- **Total**: Usually $0-5/month after free credit

## Updating Your Bot

1. Push changes to GitHub
2. Railway auto-deploys (if auto-deploy is enabled)
3. Or manually trigger: Click "Redeploy" button

## Viewing Logs

```bash
# Via Railway Dashboard
# Just click "Logs" tab - no CLI needed!

# Or via Railway CLI (optional)
npm install -g @railway/cli
railway login
railway logs
```

## Troubleshooting

### Bot not starting

- Check "Logs" tab for errors
- Verify all environment variables are set
- Check that `ARBITRUM_RPC` is accessible

### High costs

- Your bot uses minimal resources
- 5-minute polling keeps costs low
- Check "Metrics" tab to see usage

### Need to restart

- Click "Redeploy" button
- Or push a new commit to trigger redeploy

## Environment Variables Reference

Make sure to set all these in Railway:

| Variable             | Required | Default  | Description              |
| -------------------- | -------- | -------- | ------------------------ |
| `ARBITRUM_RPC`       | ✅ Yes   | -        | Your Arbitrum RPC URL    |
| `VAULT`              | ✅ Yes   | -        | Vault contract address   |
| `USDC`               | ✅ Yes   | -        | USDC contract address    |
| `DEPOSITOR`          | ✅ Yes   | -        | Your depositor address   |
| `TELEGRAM_BOT_TOKEN` | ✅ Yes   | -        | Telegram bot token       |
| `TELEGRAM_CHAT_ID`   | ✅ Yes   | -        | Telegram chat ID         |
| `TARGET_AMOUNT_DEC`  | No       | `8000`   | Threshold amount         |
| `ASSET_DECIMALS`     | No       | `6`      | Token decimals           |
| `POLL_INTERVAL_MS`   | No       | `300000` | Polling interval (5 min) |
| `SPAM_INTERVAL_SEC`  | No       | `10`     | Spam alert interval      |
| `ONE_SHOT`           | No       | `false`  | Exit after first alert   |
| `WATCH_WALLET`       | No       | -        | Optional wallet to watch |

## That's It! 🚀

Your bot is now running 24/7 on Railway. It will:

- ✅ Monitor the vault continuously
- ✅ Detect transfers instantly via events
- ✅ Poll every 5 minutes as backup
- ✅ Send Telegram alerts when threshold is met
- ✅ Auto-restart if it crashes
