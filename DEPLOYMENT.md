# Deployment Guide - Keep Bot Running 24/7

This guide shows you how to keep the AlertBot running continuously.

## Option 1: PM2 (Recommended - Easy & Cross-Platform)

PM2 is a process manager that keeps your bot running, restarts it if it crashes, and provides logging.

### Installation

```bash
npm install -g pm2
```

### Start the Bot

```bash
npm run pm2:start
```

### Useful Commands

```bash
# Check bot status
npm run pm2:status

# View logs (real-time)
npm run pm2:logs

# Restart bot
npm run pm2:restart

# Stop bot
npm run pm2:stop

# View detailed info
pm2 info alertbot

# Monitor (CPU, memory, etc.)
pm2 monit
```

### Auto-start on System Boot

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions it prints (usually involves running a sudo command)
```

After setup, the bot will automatically start when your system reboots.

---

## Option 2: macOS launchd (Native macOS Service)

Create a launchd plist file for macOS:

### Create Service File

```bash
# Create the plist file
nano ~/Library/LaunchAgents/com.alertbot.plist
```

Paste this content (update paths as needed):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.alertbot</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/bin/tsx</string>
    <string>/Users/YOUR_USERNAME/Documents/Work/Bot/AlertBot/scripts/run.ts</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/YOUR_USERNAME/Documents/Work/Bot/AlertBot</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/Users/YOUR_USERNAME/Documents/Work/Bot/AlertBot/logs/out.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USERNAME/Documents/Work/Bot/AlertBot/logs/error.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
</dict>
</plist>
```

### Load the Service

```bash
launchctl load ~/Library/LaunchAgents/com.alertbot.plist
```

### Manage the Service

```bash
# Start
launchctl start com.alertbot

# Stop
launchctl stop com.alertbot

# Unload (disable)
launchctl unload ~/Library/LaunchAgents/com.alertbot.plist
```

---

## Option 3: Docker (Containerized)

### Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]
```

### Run with Docker

```bash
# Build
docker build -t alertbot .

# Run
docker run -d --name alertbot --restart unless-stopped --env-file .env alertbot

# View logs
docker logs -f alertbot
```

---

## Option 4: Cloud Services

### VPS (DigitalOcean, AWS EC2, etc.)

1. Deploy to a VPS
2. Use PM2 or systemd to keep it running
3. Set up monitoring and alerts

### Serverless (Not Recommended)

The bot needs to run continuously, so serverless isn't ideal. However, you could use:

- AWS Lambda with EventBridge (scheduled checks)
- Google Cloud Functions
- Azure Functions

---

## Monitoring & Maintenance

### Check Bot Health

```bash
# With PM2
pm2 status
pm2 logs alertbot --lines 50

# Check if bot is responding
curl http://localhost:3000/health  # if you add a health endpoint
```

### Update the Bot

```bash
# Pull latest changes
git pull

# Restart with PM2
npm run pm2:restart

# Or rebuild and restart
npm install
npm run pm2:restart
```

### Logs Location

- PM2: `./logs/out.log` and `./logs/error.log`
- Or view with: `pm2 logs alertbot`

---

## Recommended Setup

For most users, **PM2** is the best choice because:

- ✅ Easy to install and use
- ✅ Automatic restarts on crash
- ✅ Built-in logging
- ✅ Auto-start on boot
- ✅ Works on macOS, Linux, Windows
- ✅ Low resource usage

### Quick Start with PM2

```bash
# 1. Install PM2
npm install -g pm2

# 2. Start the bot
npm run pm2:start

# 3. Set up auto-start on boot
pm2 save
pm2 startup
# Follow the instructions

# 4. Check it's running
npm run pm2:status
```

Your bot will now run 24/7 and automatically restart if it crashes! 🚀
