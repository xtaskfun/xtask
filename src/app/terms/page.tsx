import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "@/components/DocPage";
import { DEFAULT_FEE_BPS } from "@/lib/fees";
import { TASK_DURATION_DAYS, X_HANDLE, X_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — xtask.fun",
  description: "The terms for using xtask.fun as a task creator or participant.",
};

const FEE = DEFAULT_FEE_BPS / 100;

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="23 November 2026"
      intro={
        <>
          These terms apply when you use xtask.fun (the &quot;Site&quot;). By connecting a wallet, creating a task or claiming a reward you
          agree to them. Please also read the <Link href="/docs">Docs</Link>.
        </>
      }
      sections={[
        {
          id: "service",
          title: "1. What xtask.fun is",
          body: (
            <>
              <p>
                xtask.fun is an interface to smart contracts on public blockchains. Task creators deposit rewards into an escrow smart contract;
                participants who complete a task can claim a reward from that contract.
              </p>
              <ul>
                <li>
                  xtask.fun is <strong>non-custodial</strong>: we never hold your funds or your private keys. Reward pools are held by the
                  smart contract.
                </li>
                <li>
                  xtask.fun is <strong>not affiliated with, endorsed by or sponsored by X Corp.</strong> &quot;X&quot; and &quot;Twitter&quot; are
                  trademarks of their owners.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "eligibility",
          title: "2. Eligibility",
          body: (
            <ul>
              <li>You must be at least 18 years old and able to enter into a binding agreement.</li>
              <li>
                You may not use the Site if you are subject to sanctions, or if using crypto-assets or the Site is unlawful where you live. You
                are responsible for following your local laws, including tax rules.
              </li>
            </ul>
          ),
        },
        {
          id: "wallets",
          title: "3. Wallets & login",
          body: (
            <ul>
              <li>
                You connect your own wallet. Login is provided by Privy, a third-party service, and requires signing a message with your
                wallet.
              </li>
              <li>You alone are responsible for your wallet, seed phrase and private keys. We can&apos;t recover lost access or reverse transactions.</li>
              <li>We will never ask for your seed phrase or private key.</li>
            </ul>
          ),
        },
        {
          id: "creators",
          title: "4. Task creators",
          body: (
            <ul>
              <li>
                You may only create tasks for X accounts and posts you own or are authorised to promote. Tasks must not promote anything
                illegal, fraudulent, hateful, sexually explicit, or that infringes someone else&apos;s rights.
              </li>
              <li>
                When you create a task you pay the total budget you enter. A <strong>platform fee of {FEE}%</strong> of that budget is sent to
                the platform at creation and is <strong>non-refundable</strong>. The rest is the reward pool.
              </li>
              <li>
                Each task runs for <strong>{TASK_DURATION_DAYS} days</strong>. The reward pool can&apos;t be withdrawn early. After the task ends
                you can refund rewards nobody claimed.
              </li>
              <li>
                Rewards are paid to anyone the Site allows to claim. Completion of actions on X may not be verified automatically, and we do not
                guarantee any amount or quality of engagement.
              </li>
              <li>We may hide or remove any task from the Site at our discretion. This does not affect funds held by the smart contract.</li>
            </ul>
          ),
        },
        {
          id: "participants",
          title: "5. Participants",
          body: (
            <ul>
              <li>Only claim a reward for a task you have actually completed.</li>
              <li>
                Do not use bots, scripts, fake accounts or multiple wallets to claim the same task more than once, and do not try to exploit the
                Site or the smart contracts.
              </li>
              <li>You pay the network fee (gas) for your claim. Rewards are limited to the slots set by the task creator.</li>
              <li>We may exclude wallets that abuse the Site from tasks, the leaderboard or future rewards.</li>
            </ul>
          ),
        },
        {
          id: "x-rules",
          title: "6. Your use of X",
          body: (
            <p>
              Your activity on X is governed by X&apos;s own rules and terms. Rewarded engagement may be restricted by those rules, and X may
              limit or suspend accounts. You are responsible for how you use your X account; xtask.fun is not responsible for any action X
              takes on it.
            </p>
          ),
        },
        {
          id: "points",
          title: "7. Points & leaderboard",
          body: (
            <p>
              Leaderboard points are a way to show activity. They have no monetary value, are not a token or security, can&apos;t be transferred
              and may be changed, reset or discontinued at any time.
            </p>
          ),
        },
        {
          id: "risks",
          title: "8. Risks",
          body: (
            <>
              <p>Using blockchains and crypto-assets carries risk. In particular:</p>
              <ul>
                <li>
                  The smart contracts have <strong>not been audited</strong> and may contain bugs that could lead to loss of funds.
                </li>
                <li>Blockchain transactions are final and can&apos;t be reversed.</li>
                <li>Token prices can change quickly. Stablecoin issuers (e.g. Circle, Paxos) can freeze addresses, which could affect funds held by the contract.</li>
                <li>Networks, wallets, RPC providers or the Site may be slow, congested or unavailable.</li>
              </ul>
              <p>Only use amounts you can afford to lose.</p>
            </>
          ),
        },
        {
          id: "advice",
          title: "9. No financial advice",
          body: <p>Nothing on the Site is financial, investment, legal or tax advice. Do your own research.</p>,
        },
        {
          id: "third-parties",
          title: "10. Third-party services",
          body: (
            <p>
              The Site relies on third parties such as X, Privy, wallet providers, blockchain networks and RPC providers, Chainlink price feeds
              and Vercel. We are not responsible for their services, availability or terms.
            </p>
          ),
        },
        {
          id: "privacy",
          title: "11. Privacy",
          body: (
            <ul>
              <li>Your wallet address and on-chain activity are public on the blockchain.</li>
              <li>The X handle and link you enter when creating a task are stored on-chain and shown publicly.</li>
              <li>Wallet login is handled by Privy, which processes your wallet address according to its own privacy policy.</li>
              <li>We do not sell your personal data.</li>
            </ul>
          ),
        },
        {
          id: "liability",
          title: "12. Disclaimer & liability",
          body: (
            <p>
              The Site is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind. To the fullest extent permitted by
              law, xtask.fun and its contributors are not liable for any indirect, incidental or consequential loss, or for any loss of funds,
              profits or data arising from your use of the Site or the smart contracts.
            </p>
          ),
        },
        {
          id: "changes",
          title: "13. Changes",
          body: (
            <p>
              We may update these terms or change, suspend or discontinue parts of the Site. The date at the top shows the latest version.
              Continuing to use the Site means you accept the updated terms.
            </p>
          ),
        },
        {
          id: "contact",
          title: "14. Contact",
          body: (
            <p>
              Questions? Send a DM to{" "}
              <a href={X_URL} target="_blank" rel="noreferrer noopener">
                @{X_HANDLE}
              </a>{" "}
              on X.
            </p>
          ),
        },
      ]}
    />
  );
}
