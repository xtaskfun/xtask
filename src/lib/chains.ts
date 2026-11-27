import { defineChain } from "viem";
import { base, baseSepolia } from "wagmi/chains";

/** Robinhood Chain mainnet (Arbitrum Orbit L2, gas paid in ETH). */
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});

/** Elysium mainnet: Kinetiq's L2 for Hyperliquid (Arbitrum Orbit, settles to HyperEVM, gas paid in HYPE). */
export const elysium = defineChain({
  id: 99901,
  name: "Elysium",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.elysium.kinetiq.xyz"] } },
  blockExplorers: { default: { name: "Elysium Explorer", url: "https://elysium.kinetiq.xyz" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

export { base, baseSepolia };

/** Chains the escrow can run on. Which ones are live is decided in escrow.ts. */
export const ESCROW_CHAINS = [elysium, base, baseSepolia] as const;

/**
 * Chains that are no longer offered. Their tasks are hidden everywhere, but the keeper still
 * refunds ended tasks there so creators get their unclaimed rewards back.
 */
export const RETIRED_CHAINS = [robinhood] as const;

export const explorerUrl = (chainId: number) =>
  [...ESCROW_CHAINS, ...RETIRED_CHAINS].find((c) => c.id === chainId)?.blockExplorers?.default.url ?? "https://basescan.org";
