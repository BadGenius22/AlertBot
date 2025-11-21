// scripts/run.ts
import { startBot } from "../src/bot.js";
startBot().catch((e) => {
  console.error("Fatal bot error:", e);
  process.exit(1);
});
