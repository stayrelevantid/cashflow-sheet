> **Status:** Selesai — Phase 1 ✅ Phase 2 ✅ Phase 3 ✅ Phase 4 ✅  
> **Versi:** 1.0.0  
> **Tanggal Release:** 2026-03-28  
> **Developer:** Paino (DevOps/SRE)  
> **Stack:** SvelteKit · Google Sheets API · Docker · k3d (Kubernetes lokal)

# PRD — Family CashFlow-Sheet

## 1. Latar Belakang

Keluarga membutuhkan alat sederhana untuk memantau arus kas bersama secara transparan dan real-time. Tidak memerlukan database eksternal yang kompleks — cukup Google Sheets yang sudah familiar, dengan antarmuka web modern yang indah.

---

## 2. Tujuan Produk

- Mencatat transaksi keuangan keluarga secara terpusat
- Memberikan visibilitas real-time via dashboard web
- Multi-user: setiap anggota keluarga punya profil sendiri
- Konfigurasi fleksibel: anggota dan kategori bisa diubah tanpa deploy ulang
- Ringan, gratis, dan dapat di-host secara mandiri (Kubernetes lokal)

---

## 3. Pengguna Target

| Pengguna | Peran |
|---|---|
| Papa | Input & pantau semua transaksi |
| Mama | Input & pantau semua transaksi |
| Ara | Input transaksi sendiri |
| Global | View agregat seluruh keluarga |

> Anggota dapat dikonfigurasi secara dinamis melalui Settings panel atau langsung di tab "Config" Google Sheet.

---

## 4. Fitur Utama

### 4.1 Dashboard

- **KPI Cards:** Total Saldo, Total Pemasukan, Total Pengeluaran bulan ini
- **Tren Pengeluaran:** Grafik garis harian (Chart.js)
- **Distribusi Kategori:** Grafik donut per kategori
- **Perbandingan Anggota:** Grafik batang per user
- **Riwayat Transaksi:** List terbaru, sorted by date descending
- **Period Filter:** Bulan Ini / Tahun Ini / Semua

### 4.2 Input Transaksi

- **Modal form** dengan validasi client-side
- Pilih tipe: Income / Expense
- Kategori dinamis sesuai tipe dan config
- Nominal dalam IDR
- Catatan opsional (maks 200 karakter)
- Langsung POST ke Google Sheets API

### 4.3 Profile Switcher

- Tab Global / Papa / Mama / Ara (dan anggota lain yang dikonfigurasi)
- State persists di `localStorage`
- Dinamis: mengikuti daftar users dari Config tab

### 4.4 Settings Panel (⚙️)

- Tambah / hapus **Users** (anggota keluarga)
- Tambah / hapus **Expense Categories**
- Tambah / hapus **Income Categories**
- Simpan langsung ke Google Sheet tab "Config"

---

## 5. Arsitektur Teknis

```
Browser (SvelteKit SSR/CSR)
  ├── ProfileSwitcher  → userStore (localStorage)
  ├── configStore      → GET/PUT /api/config
  ├── transactionStore → GET /api/transactions, GET /api/summary
  └── TransactionForm  → POST /api/transactions

SvelteKit API Routes (Node server)
  ├── GET  /api/transactions   → getSheetData()
  ├── POST /api/transactions   → validateInput() + appendRow()
  ├── GET  /api/summary        → aggregate(getSheetData())
  ├── GET  /api/config         → getConfig()
  └── PUT  /api/config         → saveConfig()

Google Sheets API v4 (Service Account JWT)
  ├── Tab: Transactions  →  ID | Tanggal | Tipe | Kategori | Nominal | User | Catatan
  └── Tab: Config        →  Users | (empty) | Expense Categories | (empty) | Income Categories
```

---

## 6. Schema Google Sheets

### Tab: Transactions

| Kolom | Header | Tipe | Contoh |
|---|---|---|---|
| A | ID | UUID string | `a1b2-c3d4-...` |
| B | Tanggal | YYYY-MM-DD | `2026-03-28` |
| C | Tipe | `Income` / `Expense` | `Expense` |
| D | Kategori | string | `Makan` |
| E | Nominal | number (IDR) | `50000` |
| F | User | string | `Mama` |
| G | Catatan | string | `Makan siang` |

### Tab: Config

| Kolom | Konten |
|---|---|
| A | Users (Papa, Mama, Ara, ...) |
| C | Expense Categories |
| E | Income Categories |

---

## 7. Environment Variables

```bash
GOOGLE_SHEET_ID=                  # ID dari URL Google Sheet
GOOGLE_SERVICE_ACCOUNT_EMAIL=     # email SA dari JSON credentials
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_TAB_NAME=Transactions
```

---

## 8. Struktur File

```
cashflow-sheet/
├── src/
│   ├── routes/
│   │   ├── +page.svelte                    # Dashboard utama
│   │   ├── layout.css                      # CSS variables (dark mode)
│   │   └── api/
│   │       ├── transactions/+server.ts
│   │       ├── summary/+server.ts
│   │       └── config/+server.ts           # [NEW] dynamic config API
│   └── lib/
│       ├── types/transaction.ts
│       ├── stores/
│       │   ├── userStore.ts
│       │   ├── transactionStore.ts
│       │   └── configStore.ts              # [NEW] dynamic config store
│       ├── components/
│       │   ├── ProfileSwitcher.svelte      # dynamic users
│       │   ├── KPICard.svelte
│       │   ├── PeriodFilter.svelte
│       │   ├── TransactionForm.svelte      # dynamic categories
│       │   ├── TransactionList.svelte
│       │   ├── SettingsModal.svelte        # [NEW] add/remove users & categories
│       │   └── charts/
│       │       ├── LineChart.svelte
│       │       ├── PieChart.svelte
│       │       └── BarChart.svelte
│       └── utils/
│           ├── sheets.ts                   # +getConfig, +saveConfig
│           ├── uuid.ts
│           ├── formatter.ts
│           └── validator.ts
├── scripts/
│   └── seed-headers.mjs                    # setup Transactions + Config tabs
├── k8s/                                    # [Phase 4] Kubernetes manifests
├── Dockerfile                              # [Phase 3] multi-stage build
├── .env.example
├── DEV-LOG.md
└── README.md
```

---

## 9. Roadmap

| Fase | Status | Deliverable |
|---|---|---|
| Phase 1 | ✅ Done | Backend API + Google Sheets integration |
| Phase 2 | ✅ Done | Dashboard UI + Charts + Dynamic Config |
| Phase 3 | ✅ Done | Dockerfile multi-stage + docker-compose |
| Phase 4 | ✅ Done | k3d cluster + Kubernetes manifests |

---

## 10. Validasi Input (Server-side)

| Field | Rule |
|---|---|
| `tanggal` | Format YYYY-MM-DD, tidak boleh masa depan |
| `tipe` | Harus `Income` atau `Expense` |
| `kategori` | String non-empty |
| `nominal` | Angka positif, maks 1 miliar |
| `user` | String non-empty |
| `catatan` | Opsional, maks 200 karakter |

---

## 11. Non-Functional Requirements

- **Performa:** Response API < 2 detik (Google Sheets API cold start)
- **Keamanan:** Credentials hanya di `.env`, tidak di client bundle
- **Ketersediaan:** Dapat dijalankan offline di k3d lokal
- **Skalabilitas:** Desain untuk 1 keluarga (~5 anggota, ~5.000 transaksi/tahun)