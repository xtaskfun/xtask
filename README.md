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
    tasks.ts              # Tipe data + mock tasks
```

## Langkah berikutnya (TODO)
- Login X (OAuth 2.0) & verifikasi aksi lewat X API (`TaskRunner.tsx` → `verify`)
- Backend/database untuk task (ganti mock di `lib/tasks.ts`)
- Smart contract escrow untuk dana campaign & claim reward (`create/page.tsx` → `onSubmit`)
