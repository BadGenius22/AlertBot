// src/utils.ts
export function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function toHuman(amountBigInt: bigint, decimals = 6): string {
  const factor = 10n ** BigInt(decimals);
  const whole = amountBigInt / factor;
  const frac = amountBigInt % factor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}
