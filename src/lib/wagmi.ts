import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  okxWallet,
  bitgetWallet,
  phantomWallet,
  rabbyWallet,
  binanceWallet,
  zerionWallet,
  safeWallet,
  ledgerWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { mainnet, base, arbitrum, optimism, polygon, bsc } from "wagmi/chains";

export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, okxWallet, trustWallet, coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: "More wallets",
      wallets: [
        phantomWallet,
        rabbyWallet,
        bitgetWallet,
        binanceWallet,
        rainbowWallet,
        zerionWallet,
        safeWallet,
        ledgerWallet,
        injectedWallet,
      ],
    },
  ],
  { appName: "xtask.fun", projectId }
);

export const chains = [base, mainnet, arbitrum, optimism, polygon, bsc] as const;

export const wagmiConfig = createConfig({
  connectors,
  chains,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
});
