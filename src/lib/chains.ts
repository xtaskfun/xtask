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

export { base, baseSepolia };

/** Chains the escrow can be deployed on. */
export const ESCROW_CHAINS = [base, robinhood, baseSepolia] as const;

export const explorerUrl = (chainId: number) =>
  ESCROW_CHAINS.find((c) => c.id === chainId)?.blockExplorers?.default.url ?? "https://basescan.org";
