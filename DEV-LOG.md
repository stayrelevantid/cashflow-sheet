# DEV-LOG — Family CashFlow-Sheet

---

## 2026-03-28 — Phase 1 & 2 Selesai (v0.1.0)

**Developer:** Paino  
**Durasi:** ~2 jam

### ✅ Phase 1: Database & API

**Setup proyek:**
- SvelteKit scaffolded dengan TypeScript, Tailwind CSS (v4), ESLint, Prettier, dan `@sveltejs/adapter-node`
- Installed: `googleapis`, `chart.js`

**Google Sheets integration:**
- Wrapper `src/lib/utils/sheets.ts` dengan Service Account JWT auth
- `getSheetData()` — membaca semua transaksi dari sheet
- `appendRow()` — menulis satu baris transaksi ke sheet
- Seed script: `scripts/seed-headers.mjs` untuk init header row

**API Routes (SvelteKit server routes):**
- `GET /api/transactions` — filter by `user`, `month`, `year`, `type`
- `POST /api/transactions` — validasi input, auto-generate UUID, tulis ke Sheets
- `GET /api/summary` — agregasi `totalIncome`, `totalExpense`, `balance`, `byCategory`, `byUser`

**Utilities:**
- `src/lib/utils/uuid.ts` — `generateId()` via `crypto.randomUUID()`
- `src/lib/utils/formatter.ts` — `formatRupiah()`, `formatDate()`, `todayISO()`
- `src/lib/utils/validator.ts` — validasi server-side semua field transaksi
- `src/lib/types/transaction.ts` — TypeScript interfaces & constants

**Verified:** `npm run check` → 0 errors, 0 warnings

---

### ✅ Phase 2: UI & Dashboard

**Design system:**
- Dark mode glassmorphism dengan indigo/violet gradient
- Google Fonts Inter via `app.html`
- CSS custom properties (CSS variables) di `src/routes/layout.css`

**Svelte Stores:**
- `userStore.ts` — active user (Global/Papa/Mama/Ara) dengan localStorage persistence
- `transactionStore.ts` — transactions, summary, loading/error state, period filter

**Komponen:**
| Komponen | Deskripsi |
|---|---|
| `ProfileSwitcher` | Tab switcher dengan emoji avatar |
| `KPICard` | Saldo/Pemasukan/Pengeluaran dengan gradient & hover glow |
| `PeriodFilter` | Toggle Bulan Ini / Tahun Ini / Semua |
| `TransactionForm` | Modal input dengan tipe toggle & validasi |
| `TransactionList` | List transaksi sorted descending |
| `charts/LineChart` | Tren pengeluaran harian (Chart.js line) |
| `charts/PieChart` | Distribusi kategori (Chart.js doughnut) |
| `charts/BarChart` | Perbandingan anggota (Chart.js bar) |

**Catatan teknis:** Proyek menggunakan Svelte 5 (runes mode). Semua komponen ditulis dengan `$props()`, `$state()`, `$derived()`, `$effect()`, dan event handler `onclick` (bukan `on:click`).

---

### 🐛 Bug Fix: Transaksi tidak tampil di dashboard

**Root cause:** `getSheetData()` membaca dari `A2:G` (asumsi row 1 adalah header). Jika `seed-headers.mjs` belum dijalankan, data yang di-POST via form masuk ke row 1 dan ter-skip.

**Fix:** Ubah range ke `A1:G`, tambah auto-detection untuk membedakan header row vs data row berdasarkan konten kolom pertama.

**File:** `src/lib/utils/sheets.ts`

---

### Konfigurasi

**Environment variables yang dibutuhkan (`.env`):**
```
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_TAB_NAME=Transactions
```

> Format `GOOGLE_PRIVATE_KEY`: wrapped dalam double quotes, newlines sebagai `\n` literal.

---

### Next: Phase 3 — Dockerization 🐳
