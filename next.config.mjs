/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Optional deps pulled in by WalletConnect / MetaMask SDK that are not needed in the browser
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = { ...config.resolve.fallback, "@react-native-async-storage/async-storage": false };
    // Privy's optional Solana / Farcaster / Abstract integrations. The app is Ethereum-only
    // (walletChainType: "ethereum-only"), so these are never used — stub them out.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana/kit": false,
      "@solana-program/system": false,
      "@solana-program/token": false,
      "@solana-program/memo": false,
      "@farcaster/mini-app-solana": false,
      "@abstract-foundation/agw-client": false,
    };
    return config;
  },
};

export default nextConfig;
