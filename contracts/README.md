# xtask.fun escrow contract

`XTaskEscrow.sol` holds the reward pool of every task.

## How it works

1. **Create:** the creator deposits the pool (ERC20 such as USDC, or native ETH/BNB). The
   pool must split into exactly **100 slots**, so each completer gets **1% of the pool**.
2. **Claim:** after doing the X actions, the user clicks Claim. The website calls
   `POST /api/claim`. The server checks the user on X, then signs
   `Claim(taskId, user, deadline)` (EIP-712) with the **signer** key. The user sends
   that signature to `claim()` and receives 1% straight from the contract.
   - one claim per wallet per task, max 100 claims, signatures expire after 10 min
   - a signature only works for the wallet it was made for
3. **Refund:** after the task ends, the creator can call `refund()` to get the unclaimed slots back.

The contract owner can only change the signer address. It **cannot** withdraw anyone's pool.
Anyone who has the signer key can approve claims, so keep `SIGNER_PRIVATE_KEY` secret and
use a wallet that holds no funds.

## Commands

```bash
npm install
npm test                    # 11 tests
npm run export-abi          # regenerate ../src/lib/escrow-abi.ts after changing the contract
```

## Deploy (Base Sepolia testnet first)

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
   | `CLAIM_VERIFICATION` | `off` — **testnet only**, see below |
4. Redeploy the site.

## ⚠️ Before mainnet

`verifyXActions()` in `src/app/api/claim/route.ts` is not implemented yet. With
`CLAIM_VERIFICATION=off` **anyone can claim every slot without doing the task**. Use it only
on testnet. Before real money:

- add X login (OAuth 2.0) and link the X account to the wallet
- check follow/like/repost/reply/quote through the X API
- store claims in a database so one X account can't claim the same task with many wallets
- get the contract audited
