# Family CashFlow-Sheet 💰

Aplikasi manajemen keuangan keluarga yang ringan, transparan, dan real-time. Dibangun dengan SvelteKit + Google Sheets sebagai database, dijalankan di infrastruktur Kubernetes lokal.

[![Status](https://img.shields.io/badge/Phase%202-Complete-6366f1)]() [![Type Check](https://img.shields.io/badge/type--check-0%20errors-22c55e)]()

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | SvelteKit 2 + Svelte 5 (runes mode) |
| Styling | Tailwind CSS v4 + Custom CSS |
| Charts | Chart.js |
| Storage | Google Sheets API v4 (Service Account) |
| Container | Docker (multi-stage) — Phase 3 |
| Orchestrasi | k3d (k3s in Docker) — Phase 4 |

## Fitur

- 👥 **Multi-User** — Profile switcher dinamis, persists di localStorage
- 📊 **Dashboard Real-time** — KPI cards (Saldo, Pemasukan, Pengeluaran)
- 📈 **3 Grafik** — Tren harian, Distribusi kategori, Perbandingan anggota
- ✏️ **Input Transaksi** — Form modal dengan validasi + POST langsung ke Google Sheets
- ⏱️ **Filter Periode** — Bulan Ini / Tahun Ini / Semua
- ⚙️ **Settings Panel** — Tambah/hapus users & kategori, simpan ke Google Sheet
- 🌙 **Dark Mode** — Glassmorphism design dengan indigo gradient

## Prasyarat

- Node.js 20+
- Google Cloud Project dengan Sheets API diaktifkan
- Service Account dengan akses Editor ke Google Sheet

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/stayrelevantid/cashflow-sheet.git
cd cashflow-sheet
npm install
```

### 2. Konfigurasi Google Cloud

1. Buat project di [Google Cloud Console](https://console.cloud.google.com)
2. Aktifkan **Google Sheets API**
3. Buat **Service Account** → download JSON credentials
4. Buat Google Sheet baru
5. Share sheet ke email Service Account dengan akses **Editor**

### 3. Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```bash
GOOGLE_SHEET_ID=your_sheet_id_from_url
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_TAB_NAME=Transactions
```

> **Cara dapat Sheet ID:** buka Google Sheet → URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

> **Format PRIVATE_KEY:** salin dari `private_key` di JSON credentials — dalam double quotes, newlines sebagai `\n`.

### 4. Seed Google Sheet (wajib satu kali)

```bash
node scripts/seed-headers.mjs
```

Script ini akan:
- Membuat tab **Transactions** dengan header row berformat (bold, indigo, frozen)
- Membuat tab **Config** dengan data default Users & Categories
- Mengatur warna bergantian putih/abu-abu pada data rows

### 5. Jalankan Dev Server

```bash
npm run dev
```

Akses di: `http://localhost:5173`

---

## Google Sheet Structure

### Tab: Transactions

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| ID | Tanggal | Tipe | Kategori | Nominal | User | Catatan |
| `uuid` | `YYYY-MM-DD` | `Income`/`Expense` | `Makan` | `50000` | `Mama` | teks bebas |

### Tab: Config

| A | C | E |
|---|---|---|
| **Users** | **Expense Categories** | **Income Categories** |
| Papa | Makan | Gaji |
| Mama | Transportasi | Bonus |
| Ara | Jajan | Freelance |
| (tambah) | Belanja, Pendidikan, Lain | Lain |

> Edit langsung di Google Sheet **atau** via panel ⚙️ di dashboard.

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/transactions` | Ambil transaksi (filter: `user`, `month`, `year`, `type`) |
| POST | `/api/transactions` | Tambah transaksi baru |
| GET | `/api/summary` | Ringkasan agregat (filter: `user`, `period`) |
| GET | `/api/config` | Baca users & categories dari Config tab |
| PUT | `/api/config` | Update users & categories ke Config tab |

### Contoh POST Transaksi

```bash
curl -X POST http://localhost:5173/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2026-03-28",
    "tipe": "Expense",
    "kategori": "Jajan",
    "nominal": 25000,
    "user": "Ara",
    "catatan": "Es krim"
  }'
```

### Contoh PUT Config

```bash
curl -X PUT http://localhost:5173/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "users": ["Papa", "Mama", "Ara", "Nenek"],
    "expenseCategories": ["Makan", "Transportasi", "Kesehatan"],
    "incomeCategories": ["Gaji", "Investasi"]
  }'
```

---

## Struktur Proyek

```
cashflow-sheet/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Dashboard utama
│   │   ├── layout.css                # Design system (CSS variables)
│   │   └── api/
│   │       ├── transactions/+server.ts
│   │       ├── summary/+server.ts
│   │       └── config/+server.ts     # Dynamic users & categories
│   └── lib/
│       ├── types/transaction.ts
│       ├── stores/
│       │   ├── userStore.ts
│       │   ├── transactionStore.ts
│       │   └── configStore.ts        # Dynamic config store
│       ├── components/
│       │   ├── ProfileSwitcher.svelte
│       │   ├── KPICard.svelte
│       │   ├── PeriodFilter.svelte
│       │   ├── TransactionForm.svelte
│       │   ├── TransactionList.svelte
│       │   ├── SettingsModal.svelte  # Add/remove users & categories
│       │   └── charts/
│       └── utils/
│           ├── sheets.ts             # Sheets + Config helpers
│           ├── uuid.ts
│           ├── formatter.ts
│           └── validator.ts
├── scripts/
│   └── seed-headers.mjs             # Init/format Transactions + Config tabs
├── k8s/                             # Kubernetes manifests (Phase 4)
├── .env.example
├── DEV-LOG.md
└── PRD.md
```

---

## Docker (Phase 3 — Selesai)

Aplikasi siap dideploy menggunakan Docker dan Docker Compose.

**Menggunakan Docker Compose (Rekomendasi):**
```bash
# Pastikan file .env sudah diisi
docker-compose up -d --build
```

**Atau menggunakan perintah Docker standard:**
```bash
docker build -t cashflow-sheet:latest .
docker run -d -p 3000:3000 --env-file .env --name cashflow-sheet-app cashflow-sheet:latest
```

Aplikasi akan tersedia di: `http://localhost:3000`

## Kubernetes (Phase 4 — Coming Soon)

```bash
k3d cluster create family-cashflow
k3d image import cashflow-sheet:latest -c family-cashflow
kubectl apply -f k8s/
```

---

## Roadmap

| Fase | Status | Deliverable |
|---|---|---|
| Phase 1 | ✅ Done | Backend API + Google Sheets |
| Phase 2 | ✅ Done | Dashboard UI + Charts + Dynamic Config |
| Phase 3 | ✅ Done | Dockerfile + docker-compose |
| Phase 4 | ⏳ Next | k3d + Kubernetes manifests |


## License

MIT
