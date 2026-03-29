# DEV-LOG — Family CashFlow-Sheet

---

## 2026-03-28 — Phase 4: Kubernetes Deployment (v1.0.0 Release)

**Commit:** `pending`

### Kubernetes (k3d) Manifests
Telah dibuat direktori `k8s/` yang berisi konfigurasi deployment lokal menggunakan Kubernetes (k3d):
- `secret.yaml`: Menyimpan credentials Google Cloud (diabaikan oleh git).
- `deployment.yaml`: Deployment SvelteKit dengan resources limits & readiness probe.
- `service.yaml`: Service type LoadBalancer untuk eksposur port.
- `ingress.yaml`: Ingress controller rule untuk routing domain `cashflow.local`.

### Host Configuration
- Domain `cashflow.local` dipetakan ke `127.0.0.1` di `/etc/hosts`.
- Akses aplikasi via: `http://cashflow.local:8081`.

Aplikasi telah berhasil mencapai status rilis **v1.0.0**.

---

## 2026-03-28 — Phase 3: Dockerization (v0.4.0)

**Commit:** `pending`

### Multi-stage Docker Build
- Dibuat `Dockerfile` dengan multi-stage build (builder & runner).
- Menggunakan `node:20-alpine` untuk ukuran image minimal.
- `builder` stage: install dependencies, build SvelteKit app, lalu `npm prune --production` untuk menghapus dev dependencies.
- `runner` stage: copy file build dan dependencies yang diperlukan, expose port `3000`.

### Docker Compose
- Menambahkan `docker-compose.yml` untuk memudahkan deployment lokal atau di server.
- Bind port `3000:3000` dan mengarahkan file `.env`.
- Perintah deploy: `docker-compose up -d --build`.

---


## 2026-03-28 — Dropdown User Filter + Extended Period Filter (v0.3.0)

**Commit:** `pending`

### ProfileSwitcher → Dropdown

- Tab-tabs diganti dengan `<select>` dropdown bergaya custom
- Tampilkan emoji + nama untuk setiap user
- Masih membaca users secara dinamis dari `configStore`
- Tidak mengorbankan ruang horizontal di header

### PeriodFilter → 5 Mode + Year/Month Picker

**Mode yang tersedia:**
| Mode | Filter yang dikirim ke API |
|---|---|
| Bulan Ini | `year=current, month=current` |
| Bulan Lalu | `year=prev_year, month=prev_month` |
| Tahun Ini | `year=current` |
| Pilih Tahun | `year=<selected>` + dropdown tahun muncul |
| Pilih Bulan | `year=<selected>, month=<selected>` + dropdown tahun & bulan muncul |

**Perubahan teknis:**
- `transactionStore.ts`: `Period = 'month' | 'year' | 'all'` → `PeriodMode` (5 opsi), tambah `selectedYear` dan `selectedMonth` stores, `buildPeriodParams()` helper, `refreshAll()` kini menerima 4 argumen
- `/api/summary`: diganti dari param `period` string ke `year` + `month` query params (konsisten dengan `/api/transactions`)
- `PeriodFilter.svelte`: select utama + conditional year/month pickers
- `ProfileSwitcher.svelte`: tabs → styled `<select>` dropdown
- `+page.svelte`: subscribe ke `periodMode`, `selectedYear`, `selectedMonth`; `periodLabel` kini `$derived` rune (bukan store)

---

## 2026-03-28 — Dynamic Config + Light Sheet Theme (v0.2.0)

**Commit:** `7c40846`

### Google Sheet — Light Theme

- Data rows sekarang menggunakan warna **putih (#FFFFFF)** dan **abu-abu terang (#F8F9FB)** bergantian
- Header tetap indigo gelap dengan teks putih, frozen row, dan border bawah
- `seed-headers.mjs` sepenuhnya direwrite: non-destructive (skip config jika sudah ada data), otomatis buat tab "Config"

### Fitur: Dynamic Users & Categories

**Backend (`src/lib/utils/sheets.ts`):**
- `getConfig()` — membaca Users, Expense Categories, Income Categories dari tab "Config" (kolom A, C, E)
- `saveConfig()` — clear & write ulang seluruh data config ke sheet

**API Routes:**
- `GET /api/config` — mengembalikan `{ users, expenseCategories, incomeCategories }`
- `PUT /api/config` — validasi + simpan config baru ke Google Sheet

**Frontend:**
- `configStore.ts` — Svelte writable store dengan `fetchConfig()` dan `saveConfig()` actions, fallback ke default jika API gagal
- `SettingsModal.svelte` — dialog dengan chip-based add/remove UI per seksi (Users, Pengeluaran, Pemasukan)
- `ProfileSwitcher` — sekarang membaca users dari `configStore` (dinamis, emoji auto-assign)
- `TransactionForm` — membaca kategori dari `configStore` (dinamis per tipe transaksi)
- `+page.svelte` — `fetchConfig()` dipanggil di `onMount`, settings button ⚙️ di header

**Google Sheet Config Tab:**
```
A: Users         C: Expense Categories    E: Income Categories
Papa             Makan                    Gaji
Mama             Transportasi             Bonus
Ara              Jajan                    Freelance
                 Belanja                  Lain
                 Pendidikan
                 Lain
```

---

## 2026-03-28 — Phase 1 & 2 Selesai (v0.1.0)

**Commit:** `c48506a`

### ✅ Phase 1: Database & API

**Setup proyek:**
- SvelteKit scaffolded dengan TypeScript, Tailwind CSS (v4), ESLint, Prettier, dan `@sveltejs/adapter-node`
- Installed: `googleapis`, `chart.js`

**Google Sheets integration:**
- Wrapper `src/lib/utils/sheets.ts` dengan Service Account JWT auth
- `getSheetData()` — membaca semua transaksi dari sheet, auto-detect header row
- `appendRow()` — menulis satu baris transaksi ke sheet
- Seed script: `scripts/seed-headers.mjs` untuk init header row dan Config tab

**API Routes:**
- `GET /api/transactions` — filter by `user`, `month`, `year`, `type`
- `POST /api/transactions` — validasi input, auto-generate UUID, tulis ke Sheets
- `GET /api/summary` — agregasi `totalIncome`, `totalExpense`, `balance`, `byCategory`, `byUser`

**Utilities:**
- `uuid.ts` — `generateId()` via `crypto.randomUUID()`
- `formatter.ts` — `formatRupiah()`, `formatDate()`, `todayISO()`
- `validator.ts` — validasi server-side semua field transaksi
- `types/transaction.ts` — TypeScript interfaces & constants

### ✅ Phase 2: UI & Dashboard

**Design system:**
- Dark mode glassmorphism dengan indigo/violet gradient
- Google Fonts Inter, CSS custom properties

**Komponen:**
| Komponen | Deskripsi |
|---|---|
| `ProfileSwitcher` | Tab switcher dengan emoji avatar (kini dinamis) |
| `KPICard` | Saldo/Pemasukan/Pengeluaran dengan gradient & hover glow |
| `PeriodFilter` | Toggle Bulan Ini / Tahun Ini / Semua |
| `TransactionForm` | Modal input dengan tipe toggle & kategori dinamis |
| `TransactionList` | List transaksi sorted descending |
| `SettingsModal` | Manajemen users & kategori |
| `charts/LineChart` | Tren pengeluaran harian (Chart.js line) |
| `charts/PieChart` | Distribusi kategori (Chart.js doughnut) |
| `charts/BarChart` | Perbandingan anggota (Chart.js bar) |

**Catatan teknis:** Svelte 5 (runes mode) — `$props()`, `$state()`, `$derived()`, `$effect()`, `onclick`.

### 🐛 Bug Fix: Transaksi tidak tampil

- `getSheetData()` membaca dari `A2:G` — jika seed belum dijalankan, data POST masuk ke row 1 dan ter-skip
- **Fix:** baca dari `A1:G` dengan auto-detect header row

---

### Next: Phase 3 — Dockerization 🐳
