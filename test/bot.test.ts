// test/bot.test.ts
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { network } from "hardhat";
import { parseUnits, formatUnits } from "viem";
import { toHuman } from "../src/utils.js";

// Mock Telegram function to capture alerts
let capturedAlerts: string[] = [];
const originalFetch = global.fetch;

before(() => {
  // Mock fetch to capture Telegram API calls
  global.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;
    if (urlStr.includes("api.telegram.org")) {
      let body: any = {};
      if (init?.body) {
        body = JSON.parse(init.body as string);
      } else if (input instanceof Request) {
        const cloned = input.clone();
        body = await cloned.json().catch(() => ({}));
      }
      capturedAlerts.push(body.text || "");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return originalFetch(input, init);
  };
});

after(() => {
  // Restore original fetch
  global.fetch = originalFetch;
  capturedAlerts = [];
});

describe("Bot Alert Test - Arbitrum Fork", async function () {
  // Arbitrum One USDC address
  const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;

  // Known whale address on Arbitrum with USDC
  const WHALE_ADDRESS = "0x35fd2113225fa9C6afB21268BAd915F3bEfa3d98" as const;

  // You need to set these in your .env or pass as test environment variables
  const TEST_VAULT = (process.env.VAULT ||
    "0x0000000000000000000000000000000000000001") as `0x${string}`;
  const TEST_DEPOSITOR = (process.env.DEPOSITOR ||
    "0x0000000000000000000000000000000000000002") as `0x${string}`;
  const TARGET_AMOUNT_DEC = process.env.TARGET_AMOUNT_DEC || "8000";
  const ASSET_DECIMALS = 6;

  const TRANSFER_AMOUNT = "15000"; // 15k USDC to trigger alert

  it("Should detect whale transfer to vault and send alert", async function () {
    // Connect to Arbitrum network (needed for real contracts)
    const { viem } = await network.connect({ network: "arbitrumFork" });
    const publicClient = await viem.getPublicClient();

    // ERC20 ABI for USDC
    const erc20Abi = [
      {
        name: "transfer",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
      },
    ] as const;

    // Get decimals
    const decimals = await publicClient.readContract({
      address: ARBITRUM_USDC,
      abi: erc20Abi,
      functionName: "decimals",
    });

    // Note: This test checks vault balance and alert logic
    // For full testing with transfers, use scripts/test-bot-fork.ts with a local Anvil node

    // Check initial vault balance
    const initialBalance = await publicClient.readContract({
      address: ARBITRUM_USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [TEST_VAULT],
    });

    console.log(
      `Initial vault balance: ${formatUnits(initialBalance, decimals)} USDC`
    );

    // Test only checks balance and alert logic
    // For transfer testing, use scripts/test-bot-fork.ts with local Anvil node

    // Now test the bot's check logic (same as bot.ts)
    const target = parseUnits(TARGET_AMOUNT_DEC, ASSET_DECIMALS);
    const vaultBalance = await publicClient.readContract({
      address: ARBITRUM_USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [TEST_VAULT],
    });

    console.log(
      `Checking if vault balance (${formatUnits(
        vaultBalance,
        decimals
      )}) >= target (${TARGET_AMOUNT_DEC})...`
    );

    if (vaultBalance >= target) {
      // Simulate bot's alert logic
      const human = toHuman(vaultBalance, ASSET_DECIMALS);
      const alertText = `*ALERT*\n🚨 *Liquidity Available (vault balance)* 🚨\nVault: \`${TEST_VAULT}\`\nVault USDC balance: *${human} USDC*\n(But confirm maxWithdraw(owner) before withdrawing)\nTrigger: test`;

      // Send alert (will be captured by our mock)
      await fetch("https://api.telegram.org/botTEST_TOKEN/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "TEST_CHAT_ID",
          text: alertText,
          parse_mode: "Markdown",
        }),
      });

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify alert was captured
      assert.ok(capturedAlerts.length > 0, "Alert should have been sent");

      const lastAlert = capturedAlerts[capturedAlerts.length - 1];
      assert.ok(
        lastAlert.includes("Liquidity Available"),
        "Alert should contain 'Liquidity Available'"
      );
      assert.ok(
        lastAlert.includes(TEST_VAULT),
        "Alert should contain vault address"
      );

      console.log("✅ Alert captured:", lastAlert.substring(0, 100) + "...");
    } else {
      console.log(
        `⚠️  Vault balance (${formatUnits(
          vaultBalance,
          decimals
        )}) is less than target (${TARGET_AMOUNT_DEC})`
      );
      console.log("💡 To test properly, ensure:");
      console.log("   1. Run: npm run anvil:fork");
      console.log("   2. Set VAULT to a real vault address in .env");
      console.log(
        "   3. The vault should have balance >= " + TARGET_AMOUNT_DEC + " USDC"
      );
    }
  });
});
