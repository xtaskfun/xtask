import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { ALL_ESCROWS, escrowAbi } from "@/lib/escrow";
import { publicClient } from "@/lib/server/claim-flow";
import { VERIFICATION_MODE } from "@/lib/site";
import { keeperAccount } from "@/lib/server/keeper";
import { formatEther } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Setup check. Shows only public information: the signer ADDRESS derived from the
 * server key (never the key) and whether it matches the signer set in each escrow.
 */
export async function GET() {
  let serverSigner: string | null = null;
  try {
    const key = process.env.SIGNER_PRIVATE_KEY;
    if (key) serverSigner = privateKeyToAccount(key as `0x${string}`).address;
  } catch {
    serverSigner = "invalid key";
  }

  const escrows = await Promise.all(
    ALL_ESCROWS.map(async (e) => {
      try {
        const client = publicClient(e.chain);
        const onchainSigner = await client.readContract({ address: e.address, abi: escrowAbi, functionName: "signer" });
        // The refund keeper pays gas in each network's native coin (ETH, HYPE)
        const keeper = keeperAccount();
        const keeperEth = keeper ? Number(formatEther(await client.getBalance({ address: keeper.address }))) : null;
        return {
          chain: e.chain.name,
          chainId: e.chain.id,
          address: e.address,
          onchainSigner,
          signerMatches: onchainSigner === serverSigner,
          keeperEth,
          keeperNeedsGas: keeperEth !== null && keeperEth < 0.0002,
        };
      } catch {
        return { chain: e.chain.name, chainId: e.chain.id, address: e.address, error: "could not read the escrow on this chain" };
      }
    })
  );

  const ok = !!serverSigner && escrows.length > 0 && escrows.every((e) => "signerMatches" in e && e.signerMatches);
  return NextResponse.json({ ok, verificationMode: VERIFICATION_MODE, serverSigner, keeper: keeperAccount()?.address ?? null, escrows });
}
