"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { base } from "@/lib/chains";
import { ESCROWS } from "@/lib/escrow";
import { PRIVY_APP_ID, WALLETCONNECT_PROJECT_ID, chains, wagmiConfig } from "@/lib/wagmi";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#ffffff",
          logo: "/logo.png",
          landingHeader: "Connect your wallet",
          walletChainType: "ethereum-only",
          showWalletLoginFirst: true,
          walletList: [
            "detected_ethereum_wallets",
            "metamask",
            "okx_wallet",
            "robinhood_wallet",
            "coinbase_wallet",
            "binance",
            "bitget_wallet",
            "rainbow",
            "phantom",
            "zerion",
            "bybit_wallet",
            "safe",
            "wallet_connect",
          ],
        },
        // External wallets only — no Privy embedded wallets are created.
        embeddedWallets: { ethereum: { createOnLogin: "off" } },
        defaultChain: ESCROWS[0]?.chain ?? base,
        supportedChains: [...chains],
        walletConnectCloudProjectId: WALLETCONNECT_PROJECT_ID,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
