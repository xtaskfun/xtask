import { isAddress, type Address, type Chain } from "viem";
import { escrowAbi } from "./escrow-abi";
import { ESCROW_CHAINS, base, baseSepolia, robinhood } from "./chains";

export { escrowAbi };

export type Escrow = { chain: Chain; address: Address };

const addr = (v: string | undefined) => (v && isAddress(v.trim()) ? (v.trim() as Address) : undefined);
const chainById = (id: number) => ESCROW_CHAINS.find((c) => c.id === id);

// NEXT_PUBLIC_* values must be read with static names so Next.js can inline them.
// Per-network variables win over the original single-chain pair (first match per chain is used).
const configured: [Chain | undefined, Address | undefined][] = [
  [base, addr(process.env.NEXT_PUBLIC_ESCROW_ADDRESS_BASE)],
  [robinhood, addr(process.env.NEXT_PUBLIC_ESCROW_ADDRESS_ROBINHOOD)],
  [baseSepolia, addr(process.env.NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA)],
  // Original single-chain setting (kept so existing deployments keep working)
  [chainById(Number(process.env.NEXT_PUBLIC_ESCROW_CHAIN_ID || 0)), addr(process.env.NEXT_PUBLIC_ESCROW_ADDRESS)],
];

/** Every escrow this site uses, one per chain. Empty = demo mode. */
export const ESCROWS: Escrow[] = configured
  .filter((e): e is [Chain, Address] => !!e[0] && !!e[1])
  .filter(([c], i, all) => all.findIndex(([x]) => x.id === c.id) === i)
  .map(([chain, address]) => ({ chain, address }));

export const HAS_ESCROW = ESCROWS.length > 0;
export const getEscrow = (chainId: number) => ESCROWS.find((e) => e.chain.id === chainId);

/** Tasks are addressed as "<chainId>-<taskId>". A bare number means the first escrow. */
export function parseTaskKey(key: string): { escrow: Escrow; id: bigint } | null {
  const m = /^(?:(\d{1,10})-)?(\d{1,18})$/.exec(key);
  if (!m) return null;
  const escrow = m[1] ? getEscrow(Number(m[1])) : ESCROWS[0];
  return escrow ? { escrow, id: BigInt(m[2]) } : null;
}

export const taskKey = (chainId: number, id: bigint | string) => `${chainId}-${id}`;

/** Upper limit of people per task, as enforced by the contract. */
export const MAX_SLOTS = 10_000;
