# Dockerfile for AlertBot
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for tsx)
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port (if you add health check endpoint later)
# EXPOSE 3000

# Run the bot
CMD ["npm", "start"]

