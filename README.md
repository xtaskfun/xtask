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

## Mode verifikasi
Diatur lewat env `NEXT_PUBLIC_VERIFICATION_MODE`:

| Nilai | Alur |
|---|---|
| *(kosong)* / `none` — **default** | Connect wallet → buka tiap langkah lewat tombol **Go** → **Claim**. **Tidak ada pengecekan**: siapa pun bisa claim 1x per wallet. |
| `x` | Wajib login X, aksi dicek lewat X API (butuh app X Developer, lihat di bawah). |

⚠️ Mode `none` tidak bisa membedakan orang yang benar-benar mengerjakan task. Bot dengan
banyak wallet bisa menghabiskan pool. Kontrak tetap membatasi 1 claim per wallet & 100 slot.

## Login X & verifikasi (mode `x`)
User login dengan akun X (OAuth 2.0). Saat klik **verify** / **Claim**, server mengecek lewat X API:

| Aksi | Dicek dari |
|---|---|
| Follow | daftar following user (sampai 5.000 akun) |
| Like | 200 like terakhir user |
| Repost / Reply / Quote | 200 post terakhir user |

Aturan anti-curang:
- 1 akun X hanya bisa claim **sekali per task** (disimpan di Redis), 1 wallet juga sekali (di contract)
- opsional: minimal umur akun X (`X_MIN_ACCOUNT_AGE_DAYS`) & minimal follower (`X_MIN_FOLLOWERS`), default 0 = tanpa syarat

### Setup
1. **X Developer:** buka developer.x.com → buat Project + App → *User authentication settings*:
   - App permissions: **Read**
   - Type of App: **Web App (confidential client)**
   - Callback URI: `https://DOMAIN-KAMU/api/auth/x/callback` (harus sama persis dengan `NEXT_PUBLIC_SITE_URL`)
   - Website URL: `https://DOMAIN-KAMU`
   
   Lalu salin **OAuth 2.0 Client ID & Client Secret**. Paket API X harus mengizinkan
   endpoint *follows*, *likes* dan *user timeline* (cek harga di developer.x.com).
2. **Database:** di Vercel → *Storage* → buat **Upstash Redis** dan hubungkan ke project
   (env `KV_REST_API_URL` / `KV_REST_API_TOKEN` terisi otomatis).
3. **Env di Vercel:** `X_CLIENT_ID`, `X_CLIENT_SECRET`, `SESSION_SECRET` (acak 32+ karakter),
   `NEXT_PUBLIC_SITE_URL`. Lihat `.env.example` untuk semua opsi.
4. Redeploy.

## Test
```bash
npm test                      # unit test web (verifikasi X, session, store)
cd contracts && npm test      # test smart contract
```

## Langkah berikutnya (TODO)
- Audit smart contract sebelum mainnet
