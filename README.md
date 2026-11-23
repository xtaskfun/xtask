# xtask.fun

Platform task X (Twitter): user mengerjakan task (follow, like, repost, reply, quote) dan dapat reward crypto; project bisa membuat & mendanai campaign.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- RainbowKit + wagmi + viem — connect wallet dengan banyak pilihan:
  MetaMask, OKX, Trust, Coinbase, WalletConnect, Phantom, Rabby, Bitget, Binance, Rainbow, Zerion, Safe, Ledger, browser wallet
- Chain: Base, Ethereum, Arbitrum, Optimism, Polygon, BNB Chain

## Menjalankan
```bash
cp .env.example .env.local   # isi NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID dari https://cloud.reown.com
npm install
npm run dev
```
Buka http://localhost:3000

## Struktur
```
src/
  app/
    page.tsx              # Home (hero, stats, trending, how it works)
    tasks/page.tsx        # Daftar task + search, filter, sort
    tasks/[id]/           # Detail task + langkah verify & claim
    create/page.tsx       # Form buat task + live preview + ringkasan biaya
  components/             # Navbar (+ bottom nav mobile), TaskCard, Footer, Providers
  lib/
    wagmi.ts              # Daftar wallet & chain
    tasks.ts              # Tipe data + data demo
    escrow.ts, tokens.ts  # Alamat contract, chain & daftar token
    useTasks.ts           # Baca task dari contract
  app/api/claim/          # Server: verifikasi + tanda tangan claim
contracts/                # Smart contract escrow (Hardhat)
```

## Pembayaran (escrow)
Dana task disimpan di smart contract `contracts/contracts/XTaskEscrow.sol`:
- Pembuat task menyetor pool → dibagi 100 slot, tiap orang claim **1% dari pool**.
- Setelah mengerjakan task, user klik **Claim** → server (`/api/claim`) memverifikasi lalu
  memberi tanda tangan → user claim langsung dari contract.
- Setelah task berakhir, slot yang tidak di-claim bisa di-refund ke pembuat.

Cara deploy & env lengkap: lihat [`contracts/README.md`](contracts/README.md).
Selama `NEXT_PUBLIC_ESCROW_ADDRESS` belum diisi, situs memakai data demo.

## Langkah berikutnya (TODO)
- **Wajib sebelum mainnet:** login X (OAuth 2.0) & verifikasi aksi lewat X API
  (`verifyXActions` di `src/app/api/claim/route.ts`), plus database agar 1 akun X hanya bisa claim sekali per task
- Audit smart contract
