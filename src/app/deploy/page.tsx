"use client";

import { useState } from "react";
import ConnectWallet from "@/components/ConnectWallet";
import { useAccount, useDeployContract, usePublicClient, useReadContract, useSwitchChain } from "wagmi";
import { base, baseSepolia, elysium } from "@/lib/chains";
import { ESCROWS } from "@/lib/escrow";
import { encodeDeployData, getAddress, isAddress, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { escrowAbi } from "@/lib/escrow-abi";
import { escrowBytecode } from "@/lib/escrow-bytecode";
import { errMsg } from "@/app/tasks/[id]/TaskRunner";

const NETWORKS = [
  { chain: baseSepolia, label: "Base Sepolia", note: "Testnet — free test ETH", explorer: "https://sepolia.basescan.org", envKey: "NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA" },
  { chain: elysium, label: "Elysium", note: "Mainnet — real money, gas in HYPE", explorer: "https://elysium.kinetiq.xyz", envKey: "NEXT_PUBLIC_ESCROW_ADDRESS_ELYSIUM" },
  { chain: base, label: "Base", note: "Mainnet — real money", explorer: "https://basescan.org", envKey: "NEXT_PUBLIC_ESCROW_ADDRESS_BASE" },
] as const;

const DEPLOY_PAGE_VERSION = "v3 (gas + fee preset)";

// Measured deployment cost is 1,829,885 gas; leave headroom.
const FALLBACK_DEPLOY_GAS = 3_000_000n; // ~2.09M measured on Elysium

function CopyBox({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(!secret);
  return (
    <div>
      <div className="mb-1 text-xs text-muted">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
        <code className="min-w-0 flex-1 break-all text-xs">{show ? value : "•".repeat(40)}</code>
        {secret && (
          <button type="button" className="text-xs text-muted hover:text-white" onClick={() => setShow((s) => !s)}>
            {show ? "Hide" : "Show"}
          </button>
        )}
        <button
          type="button"
          className="text-xs text-brand hover:underline"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function DeployPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { deployContractAsync } = useDeployContract();

  const [net, setNet] = useState<(typeof NETWORKS)[number]>(NETWORKS[0]);
  // If an escrow already exists, every new one must use the SAME signer (the server has one key).
  const existing = ESCROWS[0];
  const existingSigner = useReadContract({
    address: existing?.address,
    abi: escrowAbi,
    functionName: "signer",
    chainId: existing?.chain.id,
    query: { enabled: !!existing },
  }).data;
  const publicClient = usePublicClient({ chainId: net.chain.id });

  const [signerKey, setSignerKey] = useState<Hex | null>(null);
  const [signerInput, setSignerInput] = useState("");
  const [savedKey, setSavedKey] = useState(false);
  const [mainnetOk, setMainnetOk] = useState(false);
  const [step, setStep] = useState<"" | "switch" | "sign" | "mining">("");
  const [error, setError] = useState("");
  const [deployed, setDeployed] = useState<{ address: Address; chainId: number; explorer: string } | null>(null);

  // The signer key is generated in this browser only — it is never sent anywhere.
  const signerAddress = signerKey
    ? privateKeyToAccount(signerKey).address
    : isAddress(signerInput.trim())
      ? getAddress(signerInput.trim())
      : existingSigner ?? null;
  const isMainnet = net.chain.id !== baseSepolia.id;
  const reuseSigner = !!existingSigner && !signerKey;
  const ready = isConnected && !!signerAddress && (!signerKey || savedKey) && (!isMainnet || mainnetOk);

  async function deploy() {
    if (!address || !signerAddress || !publicClient) return;
    setError("");
    try {
      if (chainId !== net.chain.id) {
        setStep("switch");
        await switchChainAsync({ chainId: net.chain.id });
      }
      // Estimate gas ourselves and pass it in: some wallets (e.g. OKX) fail to estimate
      // contract deployments and then refuse to confirm.
      const args = [address, signerAddress] as const;
      let gas = FALLBACK_DEPLOY_GAS;
      try {
        const est = await publicClient.estimateGas({
          account: address,
          data: encodeDeployData({ abi: escrowAbi, bytecode: escrowBytecode, args }),
        });
        gas = (est * 12n) / 10n; // +20% headroom
      } catch {
        // RPC hiccup — deployment cost is fixed (~1.83M gas), so the fallback is safe.
      }

      // Also pass the fee, so the wallet has nothing left to estimate.
      let fees: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | undefined;
      try {
        const f = await publicClient.estimateFeesPerGas();
        fees = { maxFeePerGas: f.maxFeePerGas * 2n, maxPriorityFeePerGas: f.maxPriorityFeePerGas };
      } catch {}

      setStep("sign");
      const hash = await deployContractAsync({
        abi: escrowAbi,
        bytecode: escrowBytecode,
        args,
        chainId: net.chain.id,
        gas,
        ...fees,
      });
      setStep("mining");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) throw new Error("Deployment failed");
      setDeployed({ address: receipt.contractAddress, chainId: net.chain.id, explorer: net.explorer });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setStep("");
    }
  }

  if (deployed) {
    const envKey = NETWORKS.find((n) => n.chain.id === deployed.chainId)?.envKey ?? "NEXT_PUBLIC_ESCROW_ADDRESS";
    const env = [
      `${envKey}=${deployed.address}`,
      ...(signerKey ? [`SIGNER_PRIVATE_KEY=${signerKey}`] : []),
    ].join("\n");
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="text-3xl font-bold">Escrow deployed</h1>
        <p className="mt-2 text-muted">
          Contract:{" "}
          <a className="text-brand hover:underline" href={`${deployed.explorer}/address/${deployed.address}`} target="_blank" rel="noreferrer noopener">
            {deployed.address} ↗
          </a>
        </p>
        <div className="mt-6 space-y-4 glass p-6">
          <p className="text-sm">
            Add these in <b>Vercel → Settings → Environment Variables</b>, then redeploy the site:
          </p>
          <CopyBox label="Environment variables" value={env} secret={!!signerKey} />
          {signerKey && (
            <p className="text-xs text-red-400">
              SIGNER_PRIVATE_KEY is secret. Put it only in Vercel. Anyone with it can approve claims. It is not saved anywhere else — this page forgets it when you leave.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-bold">Deploy escrow contract</h1>
      <p className="mt-2 text-muted">Deploys XTaskEscrow from your wallet. You become the owner (you can change the signer later).</p>

      <div className="mt-8 space-y-6 glass p-6">
        {/* 1. wallet */}
        <section>
          <h2 className="label">1. Owner wallet</h2>
          {isConnected ? <code className="text-sm text-muted">{address}</code> : <ConnectWallet />}
        </section>

        {/* 2. network */}
        <section>
          <h2 className="label">2. Network</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {NETWORKS.map((n) => (
              <button
                key={n.chain.id}
                type="button"
                onClick={() => setNet(n)}
                className={`rounded-xl border p-4 text-left text-sm ${net.chain.id === n.chain.id ? "border-rainbow" : "border-line text-muted hover:text-white"}`}
              >
                <div className="font-semibold text-white">{n.label}</div>
                <div className="text-xs">{n.note}</div>
              </button>
            ))}
          </div>
          {isMainnet && (
            <label className="mt-3 flex items-start gap-2 text-sm text-red-400">
              <input type="checkbox" className="mt-1" checked={mainnetOk} onChange={(e) => setMainnetOk(e.target.checked)} />
              I understand this contract has not been audited and will hold real funds.
            </label>
          )}
        </section>

        {/* 3. signer */}
        <section>
          <h2 className="label">3. Claim signer</h2>
          <p className="mb-3 text-sm text-muted">
            A separate wallet the server uses to approve claims. It needs no funds. Generate one here or paste the address of one you made.
          </p>
          {reuseSigner && !signerInput && (
            <div className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm">
              Using your current signer <code className="break-all text-xs">{existingSigner}</code> from the {existing!.chain.name} escrow, so the
              server&apos;s existing <code>SIGNER_PRIVATE_KEY</code> works for this network too. Nothing new to save.
            </div>
          )}
          {reuseSigner && !signerInput ? null : signerKey ? (
            <div className="space-y-3">
              <CopyBox label="Signer address" value={privateKeyToAccount(signerKey).address} />
              <CopyBox label="Signer private key → Vercel SIGNER_PRIVATE_KEY" value={signerKey} secret />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={savedKey} onChange={(e) => setSavedKey(e.target.checked)} />
                I copied the private key somewhere safe (password manager). It will not be shown again after I leave this page.
              </label>
              <button type="button" className="text-xs text-muted hover:text-white" onClick={() => { setSignerKey(null); setSavedKey(false); }}>
                Use an existing address instead
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn-rainbow shrink-0" onClick={() => setSignerKey(generatePrivateKey())}>
                Generate signer wallet
              </button>
              <input className="input" placeholder="or paste signer address 0x…" value={signerInput} onChange={(e) => setSignerInput(e.target.value)} />
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={!ready || !!step} onClick={deploy}>
          {step === "switch" ? `Switching to ${net.label}…` : step === "sign" ? "Confirm in wallet…" : step === "mining" ? "Deploying…" : `Deploy on ${net.label}`}
        </button>
        <p className="text-center text-[10px] text-muted/60">deploy page {DEPLOY_PAGE_VERSION}</p>
        {net.chain.id === baseSepolia.id && (
          <p className="text-center text-xs text-muted">
            Need test ETH? Use a Base Sepolia faucet (e.g. the Coinbase Developer Platform faucet).
          </p>
        )}
      </div>
    </div>
  );
}
