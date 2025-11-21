// scripts/start-anvil-fork.ts
// Helper script to start Anvil with Arbitrum fork (better than Hardhat for Arbitrum)
import { spawn, execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const rpc = process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc";

// Check if port 8545 is already in use
try {
  const pid = execSync("lsof -ti:8545", { encoding: "utf-8" }).trim();
  if (pid) {
    console.log(`⚠️  Port 8545 is already in use by process ${pid}`);
    console.log("Kill it first with: npm run node:fork:kill");
    process.exit(1);
  }
} catch {
  // Port is free, continue
}

console.log(`Starting Anvil with Arbitrum fork: ${rpc}`);
console.log("Anvil handles Arbitrum hardforks better than Hardhat 3's EDR");

const child = spawn("anvil", ["--fork-url", rpc], {
  stdio: "inherit",
  shell: true,
});

child.on("error", (error) => {
  console.error("Error starting Anvil:", error);
  console.error(
    "Make sure Foundry/Anvil is installed: https://book.getfoundry.sh/getting-started/installation"
  );
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
