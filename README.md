# Family CashFlow-Sheet 💰

Aplikasi manajemen keuangan keluarga yang ringan, transparan, dan real-time. Dibangun dengan SvelteKit + Google Sheets sebagai database, dijalankan di infrastruktur Kubernetes lokal.

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | SvelteKit 2 + Svelte 5 |
| Styling | Tailwind CSS v4 + Custom CSS |
| Charts | Chart.js |
| Storage | Google Sheets API v4 (Service Account) |
| Container | Docker (multi-stage) |
| Orchestrasi | k3d (k3s in Docker) |

## Fitur

- 👥 **Multi-User** — Profile switcher Global/Papa/Mama/Ara, persists di localStorage
- 📊 **Dashboard Real-time** — KPI cards (Saldo, Pemasukan, Pengeluaran)
- 📈 **3 Grafik** — Tren harian, Distribusi kategori, Perbandingan anggota
- ✏️ **Input Transaksi** — Form modal dengan validasi + POST langsung ke Google Sheets
- ⏱️ **Filter Periode** — Bulan Ini / Tahun Ini / Semua
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
4. Buat Google Sheet baru, buat tab bernama `Transactions`
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

> **Cara dapat Sheet ID:** Buka Google Sheet → lihat URL:  
> `https://docs.google.com/spreadsheets/d/[SHEET_ID_DI_SINI]/edit`

> **Format PRIVATE_KEY:** Salin isi field `private_key` dari JSON credentials. Pastikan wrapped dalam double quotes dan newlines sebagai `\n` literal.

### 4. Seed Header Row (Opsional tapi Direkomendasikan)

```bash
node scripts/seed-headers.mjs
```

Ini akan membuat header row di Sheet: `ID | Tanggal | Tipe | Kategori | Nominal | User | Catatan`

### 5. Jalankan Dev Server

```bash
npm run dev
```

Akses di: `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/transactions` | Ambil transaksi (filter: `user`, `month`, `year`, `type`) |
| POST | `/api/transactions` | Tambah transaksi baru |
| GET | `/api/summary` | Ringkasan agregat (filter: `user`, `period`) |

### Contoh POST

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

## Struktur Proyek

```
cashflow-sheet/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Dashboard utama
│   │   ├── +layout.svelte
│   │   ├── layout.css                # Design system (CSS variables)
│   │   └── api/
│   │       ├── transactions/+server.ts
│   │       └── summary/+server.ts
│   └── lib/
│       ├── types/transaction.ts      # TypeScript interfaces
│       ├── stores/                   # Svelte stores
│       ├── components/               # UI components
│       └── utils/                    # sheets, uuid, formatter, validator
├── scripts/
│   └── seed-headers.mjs             # Init sheet headers
├── k8s/                             # Kubernetes manifests
├── .env.example                     # Template env vars
├── Dockerfile                       # Multi-stage build (Phase 3)
├── DEV-LOG.md
└── PRD.md
```

## Docker (Phase 3 - Coming Soon)

```bash
docker build -t cashflow-sheet:latest .
docker run -p 3000:3000 --env-file .env cashflow-sheet:latest
```

## Kubernetes (Phase 4 - Coming Soon)

```bash
k3d cluster create family-cashflow
k3d image import cashflow-sheet:latest -c family-cashflow
kubectl apply -f k8s/
```

## Roadmap

- [x] Phase 1: Database & API (Google Sheets integration)
- [x] Phase 2: UI & Dashboard (Dark mode, charts, form)
- [ ] Phase 3: Dockerization
- [ ] Phase 4: Kubernetes Orchestration

## License

MIT
