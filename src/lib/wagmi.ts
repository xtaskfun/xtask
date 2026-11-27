import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { base, baseSepolia, mainnet } from "wagmi/chains";
import { elysium } from "./chains";

/** Privy app (public id). NEXT_PUBLIC_PRIVY_APP_ID overrides it. */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmwt6o5ni01jq0gl8911bsvps";

/** Optional: your own WalletConnect (Reown) project id, used by Privy for mobile wallets. */
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || undefined;

// Networks the app works with. Mainnet is only here so wallets on Ethereum can connect.
export const chains = [elysium, base, baseSepolia, mainnet] as const;

// Wallet connections are handled by Privy; wagmi just reads/writes through them.
export const wagmiConfig = createConfig({
  chains,
  transports: {
    [elysium.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});
