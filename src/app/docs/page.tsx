import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "@/components/DocPage";
import { ESCROWS, MAX_SLOTS } from "@/lib/escrow";
import { explorerUrl } from "@/lib/chains";
import { TOKENS } from "@/lib/tokens";
import { DEFAULT_FEE_BPS } from "@/lib/fees";
import { POINTS_PER_USD } from "@/lib/points";
import TokenBadge from "@/components/TokenBadge";
import { GITHUB_URL, TASK_DURATION_DAYS, VERIFICATION_MODE, XTASK_TOKEN, X_HANDLE, X_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs — xtask.fun",
  description: "How xtask.fun works: doing tasks, claiming rewards, creating campaigns, fees, networks and the escrow contract.",
};

const FEE = DEFAULT_FEE_BPS / 100;
const checksOnX = VERIFICATION_MODE === "x";

export default function DocsPage() {
  return (
    <DocPage
      eyebrow="Docs"
      title={
        <>
          How <span className="text-rainbow-flow">xtask.fun</span> works
        </>
      }
      intro="Everything you need to know to earn rewards or run a campaign — in plain words."
      sections={[
        {
          id: "overview",
          title: "Overview",
          body: (
            <>
              <p>
                xtask.fun connects <strong>projects</strong> that want engagement on X (Twitter) with <strong>people</strong> who are happy to
                follow, like, repost, reply or quote in exchange for a crypto reward.
              </p>
              <ul>
                <li>Projects deposit a reward budget into a smart contract and choose how many people can claim it.</li>
                <li>People complete the task on X and claim their share straight from the contract to their wallet.</li>
                <li>xtask.fun never holds the reward pool — the escrow smart contract does.</li>
              </ul>
            </>
          ),
        },
        {
          id: "token",
          title: "$XTASK token",
          body: (
            <>
              <p>
                <strong>$XTASK</strong> is the official token of xtask.fun.
              </p>
              <table>
                <tbody>
                  <tr>
                    <td>Name / symbol</td>
                    <td>
                      {XTASK_TOKEN.name} / ${XTASK_TOKEN.symbol}
                    </td>
                  </tr>
                  <tr>
                    <td>Network</td>
                    <td>{XTASK_TOKEN.chainName}</td>
                  </tr>
                  <tr>
                    <td>Total supply</td>
                    <td>{XTASK_TOKEN.totalSupply}</td>
                  </tr>
                  <tr>
                    <td>Contract (CA)</td>
                    <td>
                      <a href={XTASK_TOKEN.explorer} target="_blank" rel="noreferrer noopener">
                        <code>{XTASK_TOKEN.address}</code>
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
              <TokenBadge />
              <p>
                Only trust this contract address — it is the same on the
                website and on{" "}
                <a href={X_URL} target="_blank" rel="noreferrer noopener">
                  @{X_HANDLE}
                </a>
                . We will never DM you a different one.
              </p>
            </>
          ),
        },
        {
          id: "earn",
          title: "Earn: do a task",
          body: (
            <>
              <ol>
                <li>
                  <strong>Connect your wallet</strong> with the <em>Connect Wallet</em> button (MetaMask, OKX, Robinhood Wallet, Coinbase,
                  WalletConnect and more). The first time, you sign a short message to log in — this is free and is not a transaction.
                </li>
                <li>
                  <strong>Pick a task</strong> on the <Link href="/tasks">Tasks</Link> page.
                </li>
                <li>
                  <strong>Do every step on X.</strong> Tap <em>Go</em>, complete the action (follow, like, repost, reply or quote) and come
                  back. Each step needs a short moment before it is marked done.
                </li>
                <li>
                  <strong>Claim.</strong> When all steps are done, tap <em>Claim</em> and confirm in your wallet. The reward is sent from the
                  contract to your wallet in the same transaction.
                </li>
              </ol>
              <h3>Good to know</h3>
              <ul>
                <li>One claim per wallet per task, and only while the task has free slots and hasn&apos;t ended.</li>
                <li>To stop people using many wallets, each internet connection (IP address) can claim a task only once.</li>
                <li>
                  You pay a small network fee (gas) in ETH on the task&apos;s network to claim. Make sure your wallet has a little ETH there.
                </li>
                <li>
                  {checksOnX
                    ? "You log in with your X account and your actions are checked on X before you can claim. One X account can claim a task once."
                    : "Actions are currently not verified automatically on X. Please complete every step for real — projects run these campaigns to get genuine engagement, and abusing tasks can get wallets excluded."}
                </li>
                <li>After claiming you can share your reward on X with one tap.</li>
              </ul>
            </>
          ),
        },
        {
          id: "create",
          title: "Create a task",
          body: (
            <>
              <ol>
                <li>
                  Open <Link href="/create">Create</Link> and connect your wallet.
                </li>
                <li>
                  Paste the <strong>X link</strong>: a profile (for follows) or a post (needed for like, repost, reply and quote). The title
                  and your handle are filled in from the link.
                </li>
                <li>Choose the <strong>actions</strong> people must do.</li>
                <li>
                  Choose the <strong>network</strong> and <strong>reward token</strong>, then enter your <strong>total budget</strong> and the{" "}
                  <strong>number of people</strong> (1 – {MAX_SLOTS.toLocaleString("en-US")}).
                </li>
                <li>
                  Tap <em>Pay &amp; publish</em>. For tokens like USDC you approve first, then pay — two wallet confirmations. For ETH it&apos;s
                  one.
                </li>
              </ol>
              <h3>Example</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Total budget</td>
                    <td>10 USDC</td>
                  </tr>
                  <tr>
                    <td>Platform fee ({FEE}%)</td>
                    <td>− 0.50 USDC</td>
                  </tr>
                  <tr>
                    <td>Reward pool</td>
                    <td>9.50 USDC</td>
                  </tr>
                  <tr>
                    <td>Number of people</td>
                    <td>100</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Each person gets</strong>
                    </td>
                    <td>
                      <strong>0.095 USDC</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p>After publishing, use <em>Share your task on X</em> on the task page to get people in.</p>
            </>
          ),
        },
        {
          id: "fees",
          title: "Fees & refunds",
          body: (
            <ul>
              <li>
                <strong>Platform fee: {FEE}% of the budget</strong>, taken out of what you pay — there is no extra cost on top. It is sent to the
                platform when the task is created and is not refunded.
              </li>
              <li>
                Every task runs for <strong>{TASK_DURATION_DAYS} days</strong>. When it ends, the rewards nobody claimed are{" "}
                <strong>refunded to the creator automatically</strong> — no action needed.
              </li>
              <li>Rewards can&apos;t be withdrawn early, so people doing your task can always be paid.</li>
              <li>People claiming pay their own network fee (gas). There is no fee for claiming on xtask.fun.</li>
              <li>The fee can only change for new tasks, and the contract caps it at 10%.</li>
            </ul>
          ),
        },
        {
          id: "networks",
          title: "Networks & tokens",
          body: (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Network</th>
                    <th>Reward tokens</th>
                    <th>Escrow contract</th>
                  </tr>
                </thead>
                <tbody>
                  {ESCROWS.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Contracts are not configured yet.</td>
                    </tr>
                  ) : (
                    ESCROWS.map((e) => (
                      <tr key={e.chain.id}>
                        <td>{e.chain.name}</td>
                        <td>{(TOKENS[e.chain.id] ?? []).map((t) => t.symbol).join(", ")}</td>
                        <td>
                          <a href={`${explorerUrl(e.chain.id)}/address/${e.address}`} target="_blank" rel="noreferrer noopener">
                            <code>
                              {e.address.slice(0, 6)}…{e.address.slice(-4)}
                            </code>{" "}
                            ↗
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <p>
                Before a token can be used, the site checks its name and decimals on-chain; tokens that don&apos;t match are disabled. Gas on
                both networks is paid in ETH.
              </p>
            </>
          ),
        },
        {
          id: "leaderboard",
          title: "Leaderboard & points",
          body: (
            <ul>
              <li>
                Task creators earn <strong>{POINTS_PER_USD} points for every $1</strong> spent on tasks (budget including the fee, minus any
                refunds).
              </li>
              <li>USDC, USDT and USDG count as $1. ETH is valued with the Chainlink ETH/USD price on Base.</li>
              <li>
                Points currently have no cash value and are shown on the <Link href="/leaderboard">Leaderboard</Link>, updated every minute.
              </li>
            </ul>
          ),
        },
        {
          id: "security",
          title: "Security & smart contract",
          body: (
            <>
              <ul>
                <li>
                  Reward pools sit in the <strong>XTaskEscrow</strong> smart contract. Each claim needs a short-lived signature from the
                  xtask.fun server and can only be used by the wallet it was made for.
                </li>
                <li>
                  The contract owner can change the claim signer and the platform fee (max 10%, new tasks only). The owner{" "}
                  <strong>cannot</strong> withdraw any task&apos;s reward pool.
                </li>
                <li>
                  The contract has <strong>not been audited</strong> yet. Only use amounts you are comfortable with.
                </li>
                <li>xtask.fun will never ask for your seed phrase or private key.</li>
                <li>
                  The website and smart contract code are open source on{" "}
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                    GitHub
                  </a>
                  .
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "faq",
          title: "FAQ",
          body: (
            <>
              <h3>Why do I have to sign a message when connecting?</h3>
              <p>It proves you own the wallet and logs you in. It is free and does not move any funds.</p>
              <h3>My claim failed. Why?</h3>
              <p>
                Usually the task is full or ended, you already claimed with this wallet, or you have no ETH for gas on that network. Try again
                after checking these.
              </p>
              <h3>Can I claim the same task twice?</h3>
              <p>No — one claim per wallet per task.</p>
              <h3>I created a task by mistake. Can I cancel it?</h3>
              <p>Not before it ends. After {TASK_DURATION_DAYS} days every unclaimed reward is refunded to your wallet automatically. The platform fee is not refunded.</p>
              <h3>Where can I get help?</h3>
              <p>
                Send a DM to{" "}
                <a href={X_URL} target="_blank" rel="noreferrer noopener">
                  @{X_HANDLE}
                </a>{" "}
                on X.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
