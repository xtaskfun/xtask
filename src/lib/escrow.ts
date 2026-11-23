import { isAddress, type Address } from "viem";
import { base, baseSepolia } from "wagmi/chains";
import { escrowAbi } from "./escrow-abi";

export { escrowAbi };

const rawAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

/** Escrow contract address, or undefined while not deployed yet (site shows demo data). */
export const ESCROW_ADDRESS: Address | undefined =
  rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : undefined;

/** Chain the escrow lives on. Defaults to Base Sepolia (testnet). */
export const ESCROW_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ESCROW_CHAIN_ID || baseSepolia.id);
export const ESCROW_CHAIN = [base, baseSepolia].find((c) => c.id === ESCROW_CHAIN_ID) ?? baseSepolia;

export const SLOTS = 100; // each completer claims 1% of the pool
