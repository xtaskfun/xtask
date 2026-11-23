# xtask.fun escrow contract

`XTaskEscrow.sol` holds the reward pool of every task.

## How it works

1. **Create:** the creator picks the **reward per person** and the **number of people**
   (1–10,000) and deposits reward × people (ERC20 such as USDC, or native ETH).
2. **Claim:** after doing the X actions, the user clicks Claim. The website calls
   `POST /api/claim`. The server checks the user on X, then signs
   `Claim(taskId, user, deadline)` (EIP-712) with the **signer** key. The user sends
   that signature to `claim()` and receives the reward straight from the contract.
   - one claim per wallet per task, no more claims than people set, signatures expire after 10 min
   - a signature only works for the wallet it was made for
3. **Refund:** after the task ends, the creator can call `refund()` to get the unclaimed slots back.

The contract owner can only change the signer address. It **cannot** withdraw anyone's pool.
Anyone who has the signer key can approve claims, so keep `SIGNER_PRIVATE_KEY` secret and
use a wallet that holds no funds.

## Commands

```bash
npm install
npm test                    # 13 tests
npm run export-abi          # regenerate ../src/lib/escrow-abi.ts after changing the contract
```

## Deploy — easiest: from the website

Open **https://YOUR-SITE/deploy**, connect your wallet, pick Base Sepolia (or Base),
click **Generate signer wallet**, save the key, then **Deploy**. The page shows the
env variables to paste into Vercel. Your wallet becomes the owner.

## Deploy from the command line (Base Sepolia testnet first)

1. Create two new wallets:
   - **deployer**: needs a little ETH for gas (Base Sepolia faucet for testnet)
   - **signer**: holds nothing, only signs claims
2. Deploy:
   ```bash
   DEPLOYER_PRIVATE_KEY=0x... SIGNER_ADDRESS=0x... npm run deploy:base-sepolia
   ```
   For mainnet use `npm run deploy:base`.
3. In Vercel → Settings → Environment Variables add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_ESCROW_ADDRESS` | address printed by the deploy |
   | `NEXT_PUBLIC_ESCROW_CHAIN_ID` | `84532` (Base Sepolia) or `8453` (Base) |
   | `SIGNER_PRIVATE_KEY` | private key of the **signer** wallet |
4. Set up X login + database — see the main [README](../README.md#login-x--verifikasi).
5. Redeploy the site.

`CLAIM_VERIFICATION=off` skips X verification so **anyone can claim every slot**. Only for a
quick testnet try-out; never set it on mainnet.

## ⚠️ Before mainnet

- get the contract audited
