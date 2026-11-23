# xtask.fun

**Engage on X. Earn onchain.**

xtask.fun is a social task platform. Projects fund a campaign that asks people to follow,
like, repost, reply to or quote on X. The project sets the reward per person and how many
people can claim it; each person who completes the task claims their reward straight from a
smart contract.

- Website: https://xtask.fun
- X: [@Xtaskfun](https://x.com/Xtaskfun)

## Features

- **Create a task** — paste an X link, pick the actions, choose a network and token, deposit the pool.
  The title is generated automatically (e.g. "Follow + Like @Xtaskfun").
- **Do tasks & claim** — connect a wallet, open each step on X, claim the reward.
- **Escrow smart contract** — funds are held by the contract, not by xtask. Reward and number of people set by the creator (up to 10,000),
  one claim per wallet, unclaimed slots refundable to the creator after the task ends (30 days).
- **Multi-chain** — Base and Robinhood Chain (plus Base Sepolia for testing).
- **Many wallets** — MetaMask, OKX, Trust, Coinbase, WalletConnect, Phantom, Rabby, Bitget,
  Binance, Rainbow, Zerion, Safe, Ledger and any browser wallet (RainbowKit).
- **Optional X verification** — X login (OAuth 2.0) and checks through the X API.

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- RainbowKit, wagmi, viem
- Solidity 0.8.24 + OpenZeppelin, Hardhat
- Upstash Redis (only for X verification mode)
- Vitest

## Getting started

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (free at https://cloud.reown.com)
npm install
npm run dev
```

Open http://localhost:3000. Without an escrow address the site runs in **demo mode** with sample tasks.

## Project structure

```
src/
  app/
    page.tsx              Home
    tasks/page.tsx        Task list (search, filters, sort)
    tasks/[id]/           Task detail: steps, claim, refund
    create/page.tsx       Create a task (live preview)
    deploy/page.tsx       Deploy the escrow from your wallet
    api/claim/            Signs claims for the escrow
    api/verify/           X verification (mode "x")
    api/auth/x/           X login (mode "x")
    api/health/           Setup check
  components/             Navbar, TaskCard, XAvatar, ...
  lib/
    chains.ts             Supported networks (incl. Robinhood Chain)
    escrow.ts             Escrow addresses per network
    tokens.ts             Reward tokens per network
    useTasks.ts           Reads tasks from the contracts
    server/               Sessions, X API checks, storage
contracts/                XTaskEscrow smart contract (Hardhat)
tests/                    Unit tests
```

## How payments work

The escrow contract is [`contracts/contracts/XTaskEscrow.sol`](contracts/contracts/XTaskEscrow.sol).

1. **Create** — the creator enters a **total budget** and the number of people (1–10,000).
   A **5% platform fee** is taken out of the budget (no extra cost) and goes to the fee
   recipient right away; the rest is split equally. E.g. 10 USDC for 100 people → 0.5 fee,
   9.5 pool, 0.095 each. ERC20 or native ETH.
2. **Claim** — the site asks `/api/claim` for a signature (EIP-712) made by the **signer** key,
   then the user calls `claim()` and receives the reward from the contract. One claim per wallet,
   no more claims than people set, signatures expire after 10 minutes.
3. **Refund** — after the task ends, the creator calls `refund()` to get the unclaimed slots back.

The contract owner can change the signer and the fee (max 10%, new tasks only). It cannot move anyone's pool.
See [`contracts/README.md`](contracts/README.md) for details and deployment.

## Networks

One escrow per network, all using the **same signer**. Set the env for each network you use:

| Network | Env |
|---|---|
| Base (8453) | `NEXT_PUBLIC_ESCROW_ADDRESS` + `NEXT_PUBLIC_ESCROW_CHAIN_ID=8453`, or `NEXT_PUBLIC_ESCROW_ADDRESS_BASE` |
| Robinhood Chain (4663) | `NEXT_PUBLIC_ESCROW_ADDRESS_ROBINHOOD` |
| Base Sepolia (84532) | `NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA` |

The easiest way to deploy is the `/deploy` page: connect your wallet, pick a network, deploy.
When an escrow already exists, the page reuses its signer automatically.

Reward tokens are listed in [`src/lib/tokens.ts`](src/lib/tokens.ts). The create page reads
`symbol()` and `decimals()` of each token on-chain and disables any token that doesn't match —
a guard against a wrong address.

Check your setup at `/api/health`. It shows whether the server's signer matches every escrow
(only public addresses are shown, never a key).

## Verification modes

Set with `NEXT_PUBLIC_VERIFICATION_MODE`:

| Value | Flow |
|---|---|
| empty / `none` (default) | Connect wallet → open each step with **Go** → **Claim**. **No check**: anyone can claim once per wallet. |
| `x` | X login required; actions are checked through the X API. |

> ⚠️ Mode `none` cannot tell whether someone really did the task. Someone with many wallets
> can drain a pool. The contract still limits claims to one per wallet and the number of people set for the task.
> Start with small pools.

### X verification (mode `x`)

Users log in with X (OAuth 2.0). On **verify** / **claim** the server checks:

| Action | Checked against |
|---|---|
| Follow | the user's following list (up to 5,000 accounts) |
| Like | the user's last 200 likes |
| Repost / Reply / Quote | the user's last 200 posts |

Anti-abuse: one X account can claim a task only once (stored in Redis). Optional minimum
account age (`X_MIN_ACCOUNT_AGE_DAYS`) and followers (`X_MIN_FOLLOWERS`), both 0 by default.

Setup:

1. On developer.x.com create a Project + App. Under *User authentication settings* choose
   **Read** permissions, **Web App** type, and set the callback URL to
   `https://YOUR-DOMAIN/api/auth/x/callback`. Your X API plan must include the follows,
   likes and user timeline endpoints.
2. Add an **Upstash Redis** database (e.g. Vercel → Storage). `KV_REST_API_URL` /
   `KV_REST_API_TOKEN` are picked up automatically.
3. Set `X_CLIENT_ID`, `X_CLIENT_SECRET`, `SESSION_SECRET` (random, 32+ characters) and
   `NEXT_PUBLIC_SITE_URL`. See [`.env.example`](.env.example) for all options.

> Rewarding follows, likes or reposts may conflict with X's platform rules. Review X's
> developer and automation policies before enabling this mode.

## Environment variables

See [`.env.example`](.env.example). The minimum for a live site:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect / mobile wallets |
| `NEXT_PUBLIC_ESCROW_ADDRESS` + `NEXT_PUBLIC_ESCROW_CHAIN_ID` (or the per-network vars) | Escrow contracts |
| `SIGNER_PRIVATE_KEY` | Claim signer (server only — keep it secret, store it as a sensitive variable) |

## Tests

```bash
npm test                    # web app unit tests
cd contracts && npm test    # smart contract tests
```

## Security

- The contract has **not been audited**. Use small amounts until it is.
- Never commit `.env` files or private keys. The signer key only belongs in your hosting
  provider's secret settings.
- Paxos (USDG) and Circle (USDC) can freeze addresses; funds in the escrow are subject to that.
