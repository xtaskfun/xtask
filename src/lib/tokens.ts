import { zeroAddress, type Address } from "viem";
import { base, baseSepolia, mainnet, arbitrum, optimism, polygon, bsc } from "wagmi/chains";
import { robinhood } from "./chains";

export type Token = { symbol: string; address: Address; decimals: number };

const native = (symbol: string): Token => ({ symbol, address: zeroAddress, decimals: 18 });

// Reward tokens creators can fund a task with, per chain.
// The create page reads symbol() and decimals() from each ERC20 on-chain and hides any
// token whose on-chain values don't match this list — a guard against a wrong address.
// To add a token: put its official contract address here (check the issuer's docs).
export const TOKENS: Record<number, Token[]> = {
  [base.id]: [
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "USDT", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
    native("ETH"),
  ],
  [robinhood.id]: [
    // Paxos Global Dollar. Address from Robinhood Chain listings; the on-chain check above
    // must still see symbol "USDG" before it can be used.
    { symbol: "USDG", address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", decimals: 6 },
    // Official xtask.fun token
    { symbol: "XTASK", address: "0xb77ff90493244cc301f6d9db2493d46c4ca02da9", decimals: 18 },
    { symbol: "PONS", address: "0x39dbed3a2bd333467115de45665cc57f813c4571", decimals: 18 },
    { symbol: "ORBIO", address: "0xaa07a0e9209e16ac99708c3ec70159c6ef3128a3", decimals: 18 },
    native("ETH"),
  ],
  [baseSepolia.id]: [
    { symbol: "USDC", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimals: 6 },
    native("ETH"),
  ],
  [mainnet.id]: [
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2E9Eb0cE3606eB48", decimals: 6 },
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    native("ETH"),
  ],
  [arbitrum.id]: [
    { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    native("ETH"),
  ],
  [optimism.id]: [
    { symbol: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6 },
    native("ETH"),
  ],
  [polygon.id]: [
    { symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
    native("POL"),
  ],
  [bsc.id]: [
    { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
    native("BNB"),
  ],
};

export function findToken(chainId: number, address: Address): Token {
  return (
    TOKENS[chainId]?.find((t) => t.address.toLowerCase() === address.toLowerCase()) ?? {
      symbol: `${address.slice(0, 6)}…`,
      address,
      decimals: 18,
    }
  );
}
