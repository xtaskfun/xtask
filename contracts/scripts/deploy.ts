import hre from "hardhat";
import { getAddress } from "viem";

// Usage:
//   DEPLOYER_PRIVATE_KEY=0x... SIGNER_ADDRESS=0x... npm run deploy:base-sepolia
async function main() {
  const signer = process.env.SIGNER_ADDRESS;
  if (!signer) throw new Error("Set SIGNER_ADDRESS (public address of the backend claim signer)");

  const [deployer] = await hre.viem.getWalletClients();
  const owner = getAddress(process.env.OWNER_ADDRESS || deployer.account.address);

  const escrow = await hre.viem.deployContract("XTaskEscrow", [owner, getAddress(signer)]);
  console.log(`XTaskEscrow deployed on ${hre.network.name}: ${escrow.address}`);
  console.log(`owner:  ${owner}\nsigner: ${getAddress(signer)}`);
  console.log(`\nSet in Vercel:\n  NEXT_PUBLIC_ESCROW_ADDRESS=${escrow.address}\n  NEXT_PUBLIC_ESCROW_CHAIN_ID=${await (await hre.viem.getPublicClient()).getChainId()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
