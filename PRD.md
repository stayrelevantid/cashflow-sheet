# PRD — Family CashFlow-Sheet

> **Status:** In Progress — Phase 1 ✅ Phase 2 ✅ Phase 3 ⏳  
> **Versi:** 0.1.0  
> **Tanggal:** 2026-03-28  
> **Developer:** Paino (DevOps/SRE)  
> **Stack:** SvelteKit · Google Sheets API · Docker · k3d (Kubernetes lokal)

---

## 1. Visi Produk

**Family CashFlow-Sheet** adalah aplikasi manajemen keuangan keluarga yang ringan, transparan, dan mudah digunakan. Aplikasi ini memungkinkan setiap anggota keluarga (Papa, Mama, Ara) untuk mencatat dan memantau pemasukan/pengeluaran dalam satu dashboard terpadu.

### Tujuan Utama
- Memberikan visibilitas keuangan keluarga secara real-time.
- Mengurangi ketergantungan pada spreadsheet manual yang tidak terstruktur.
- Dijalankan di infrastruktur Kubernetes lokal sebagai latihan nyata DevOps.

### Non-Tujuan (Out of Scope)
- Tidak ada fitur autentikasi/login per-user (user dipilih via dropdown).
- Tidak ada notifikasi push atau reminder otomatis.
- Tidak ada integrasi perbankan atau payment gateway.

---

## 2. Pengguna (Users)

| Pengguna | Peran            | Hak Akses                              |
|----------|------------------|----------------------------------------|
| Papa     | Pencatat utama   | Input & lihat semua data               |
| Mama     | Pencatat utama   | Input & lihat semua data               |
| Ara      | Pencatat anak    | Input & lihat semua data               |
| Global   | View aggregat    | Hanya melihat (tidak bisa input)       |

> **Catatan:** Tidak ada sistem autentikasi. User dipilih melalui Profile Switcher di UI.

---

## 3. Fitur Utama

### 3.1 Multi-User Selection

**Deskripsi:** Mekanisme pemilihan profil aktif untuk menentukan konteks tampilan data dan identitas input transaksi.

**Komponen UI:**
- **Profile Switcher:** Dropdown atau tab yang menampilkan pilihan: `Global`, `Papa`, `Mama`, `Ara`.
- **Identity Tagging:** Setiap transaksi yang di-input secara otomatis akan menyertakan nama user yang sedang aktif pada kolom `User` di Google Sheets.

**Behavior:**
- Default saat pertama buka: `Global` (tampil semua data agregat).
- Saat user dipilih (misal: `Ara`), dashboard akan menampilkan data yang hanya terkait `Ara`.
- State user aktif disimpan di `localStorage` agar persisten saat halaman di-refresh.

**Acceptance Criteria:**
- [ ] Dropdown tampil dengan 4 pilihan: Global, Papa, Mama, Ara.
- [ ] Saat user dipilih, semua data dashboard ter-filter sesuai user tersebut.
- [ ] Transaksi baru yang di-input tercatat dengan nama user yang aktif.
- [ ] State user aktif persisten di `localStorage`.

---

### 3.2 Dashboard & Analitik

**Deskripsi:** Halaman utama yang menampilkan ringkasan keuangan dalam bentuk KPI cards dan grafik visual.

#### 3.2.1 KPI Cards

Tiga kartu metrik utama yang ditampilkan di bagian atas dashboard:

| Kartu            | Kalkulasi                                      | Filter Default |
|------------------|------------------------------------------------|----------------|
| Saldo Total      | Total Pemasukan − Total Pengeluaran            | Bulan Ini      |
| Total Pemasukan  | SUM semua transaksi dengan `Tipe = Income`     | Bulan Ini      |
| Total Pengeluaran| SUM semua transaksi dengan `Tipe = Expense`    | Bulan Ini      |

**Filter yang tersedia:**
- Bulan Ini (default)
- Tahun Ini
- Semua Waktu

#### 3.2.2 Grafik Visual

**1. Tren Pengeluaran (Line Chart)**
- **Tipe:** Line Chart
- **Sumbu X:** Tanggal (harian)
- **Sumbu Y:** Nominal pengeluaran
- **Filter:** Berdasarkan user aktif & periode waktu
- **Library:** LayerChart atau Chart.js

**2. Distribusi Kategori (Pie Chart)**
- **Tipe:** Pie / Donut Chart
- **Data:** Persentase pengeluaran per kategori (misal: Makan 40%, Transportasi 20%)
- **Filter:** Berdasarkan user aktif & periode waktu

**3. Perbandingan User (Bar Chart)**
- **Tipe:** Grouped Bar Chart
- **Sumbu X:** Nama user (Papa, Mama, Ara)
- **Sumbu Y:** Total pengeluaran
- **Tujuan:** Membandingkan pola pengeluaran antar-anggota keluarga dalam satu periode

**Acceptance Criteria:**
- [ ] Tiga KPI cards tampil dengan nilai yang benar.
- [ ] Filter periode (Bulan Ini / Tahun Ini) memperbarui semua cards dan chart.
- [ ] Line chart menampilkan tren harian.
- [ ] Pie chart menampilkan distribusi kategori.
- [ ] Bar chart membandingkan total pengeluaran antar-user.
- [ ] Semua chart responsif terhadap pergantian user aktif.

---

### 3.3 Input Transaksi

**Deskripsi:** Form untuk mencatat transaksi baru ke Google Sheets.

**Field Form:**

| Field     | Tipe Input         | Wajib | Keterangan                          |
|-----------|--------------------|-------|-------------------------------------|
| Tanggal   | Date picker        | Ya    | Default: hari ini                   |
| Tipe      | Radio / Select     | Ya    | `Income` atau `Expense`             |
| Kategori  | Select / Combobox  | Ya    | Pilihan predefined + custom         |
| Nominal   | Number input       | Ya    | Format Rupiah (IDR)                 |
| Catatan   | Textarea           | Tidak | Keterangan tambahan opsional        |

> **User** diisi otomatis dari user yang sedang aktif (tidak perlu diisi manual).  
> **ID** diisi otomatis menggunakan UUID v4.

**Kategori Predefined:**

| Tipe    | Kategori                                              |
|---------|-------------------------------------------------------|
| Expense | Makan, Transportasi, Jajan, Belanja, Pendidikan, Lain |
| Income  | Gaji, Bonus, Freelance, Lain                          |

**Behavior:**
- Setelah submit berhasil, data langsung muncul di dashboard (re-fetch otomatis).
- Form di-reset setelah submit berhasil.
- Validasi client-side sebelum mengirim data ke API.

**Acceptance Criteria:**
- [ ] Form dapat diisi dan di-submit.
- [ ] Data tersimpan di Google Sheets dengan format yang benar.
- [ ] Field `User` dan `ID` terisi otomatis.
- [ ] Validasi error ditampilkan jika field wajib kosong.
- [ ] Dashboard diperbarui setelah transaksi berhasil disimpan.

---

### 3.4 Integrasi Google Sheets

**Deskripsi:** Google Sheets digunakan sebagai database utama menggunakan Service Account.

**Schema Spreadsheet:**

| Kolom    | Tipe Data | Contoh Nilai                         | Keterangan              |
|----------|-----------|--------------------------------------|-------------------------|
| ID       | String    | `550e8400-e29b-41d4-a716-446655440000` | UUID v4, auto-generated |
| Tanggal  | String    | `2026-03-28`                         | Format ISO 8601         |
| Tipe     | String    | `Expense` / `Income`                 | Enum, case-sensitive    |
| Kategori | String    | `Jajan`                              | Dari daftar predefined  |
| Nominal  | Number    | `50000`                              | Angka bulat (IDR)       |
| User     | String    | `Ara`                                | Dari daftar user aktif  |
| Catatan  | String    | `Beli es krim`                       | Opsional, bisa kosong   |

**Contoh Baris Data:**

```
ID                                     | Tanggal    | Tipe    | Kategori | Nominal | User | Catatan
550e8400-e29b-41d4-a716-446655440000   | 2026-03-28 | Expense | Jajan    | 50000   | Ara  | Beli es krim
```

**Setup:**
- Gunakan **Google Sheets API v4** dengan **Service Account**.
- Share Google Sheet ke email Service Account dengan akses **Editor**.
- Nama sheet tab: `Transactions` (atau dapat dikonfigurasi via env var).

---

## 4. Spesifikasi Teknis

### 4.1 Tech Stack

| Layer           | Teknologi                     | Versi / Keterangan            |
|-----------------|-------------------------------|-------------------------------|
| Frontend        | SvelteKit                     | Latest stable                 |
| Styling         | Tailwind CSS + shadcn-svelte  | Tailwind v3                   |
| Visualisasi     | LayerChart atau Chart.js      | Pilih satu, konsisten         |
| Backend/API     | SvelteKit Server Routes       | `+server.ts` / API Routes     |
| Storage         | Google Sheets API v4          | Service Account Auth          |
| Containerisasi  | Docker (Multi-stage build)    | Node 20 Alpine base image     |
| Orchestrasi     | k3d (k3s in Docker)           | Simulasi production lokal     |

### 4.2 Struktur Direktori Proyek

```
cashflow-sheet/
├── src/
│   ├── routes/
│   │   ├── +page.svelte          # Dashboard utama
│   │   ├── +layout.svelte        # Layout global
│   │   └── api/
│   │       ├── transactions/
│   │       │   ├── +server.ts    # GET: ambil semua transaksi
│   │       │   └── +server.ts    # POST: tambah transaksi baru
│   │       └── summary/
│   │           └── +server.ts    # GET: ringkasan aggregat
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Dashboard.svelte
│   │   │   ├── KPICard.svelte
│   │   │   ├── TransactionForm.svelte
│   │   │   ├── ProfileSwitcher.svelte
│   │   │   ├── LineChart.svelte
│   │   │   ├── PieChart.svelte
│   │   │   └── BarChart.svelte
│   │   ├── stores/
│   │   │   ├── userStore.ts      # State user aktif
│   │   │   └── transactionStore.ts
│   │   └── utils/
│   │       ├── sheets.ts         # Wrapper Google Sheets API
│   │       ├── uuid.ts           # UUID generator
│   │       └── formatter.ts     # Format Rupiah, tanggal, dll
│   └── app.html
├── .env                          # Environment variables (jangan di-commit)
├── .env.example                  # Template env vars
├── Dockerfile
├── docker-compose.yml            # Untuk development lokal
├── k8s/
│   ├── secret.yaml               # Google API credentials
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── PRD.md
└── package.json
```

### 4.3 API Routes

#### `GET /api/transactions`

Mengambil semua transaksi dari Google Sheets.

**Query Parameters (opsional):**

| Parameter | Tipe   | Contoh      | Keterangan                         |
|-----------|--------|-------------|------------------------------------|
| `user`    | string | `Ara`       | Filter by user (`Papa`, `Mama`, dll) |
| `month`   | string | `2026-03`   | Filter by bulan (format `YYYY-MM`) |
| `year`    | string | `2026`      | Filter by tahun                    |
| `type`    | string | `Expense`   | Filter by tipe transaksi           |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tanggal": "2026-03-28",
      "tipe": "Expense",
      "kategori": "Jajan",
      "nominal": 50000,
      "user": "Ara",
      "catatan": "Beli es krim"
    }
  ],
  "total": 1
}
```

---

#### `POST /api/transactions`

Menambahkan transaksi baru ke Google Sheets.

**Request Body:**

```json
{
  "tanggal": "2026-03-28",
  "tipe": "Expense",
  "kategori": "Jajan",
  "nominal": 50000,
  "user": "Ara",
  "catatan": "Beli es krim"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response Error (400 Bad Request):**

```json
{
  "success": false,
  "error": "Field 'nominal' wajib diisi"
}
```

---

#### `GET /api/summary`

Mengambil ringkasan agregat keuangan.

**Query Parameters (opsional):**

| Parameter | Tipe   | Keterangan            |
|-----------|--------|-----------------------|
| `user`    | string | Filter by user        |
| `period`  | string | `month` atau `year`   |

**Response (200 OK):**

```json
{
  "totalIncome": 5000000,
  "totalExpense": 3200000,
  "balance": 1800000,
  "byCategory": {
    "Makan": 800000,
    "Jajan": 200000,
    "Transportasi": 150000
  },
  "byUser": {
    "Papa": 1500000,
    "Mama": 1200000,
    "Ara": 500000
  }
}
```

---

## 5. Environment Variables

File `.env` (tidak boleh di-commit ke version control):

```bash
# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_TAB_NAME=Transactions

# App
PUBLIC_APP_NAME="Family CashFlow-Sheet"
PORT=3000
NODE_ENV=production
```

File `.env.example` (commit ini ke repo):

```bash
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_TAB_NAME=Transactions
PUBLIC_APP_NAME="Family CashFlow-Sheet"
PORT=3000
NODE_ENV=development
```

---

## 6. Docker & Infrastruktur

### 6.1 Dockerfile (Multi-stage Build)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build/index.js"]
```

### 6.2 docker-compose.yml (Development Lokal)

```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

### 6.3 Kubernetes Manifests (`k8s/`)

#### `secret.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cashflow-secrets
type: Opaque
stringData:
  GOOGLE_SHEET_ID: "your_sheet_id"
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "your-sa@project.iam.gserviceaccount.com"
  GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

#### `deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cashflow-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cashflow
  template:
    metadata:
      labels:
        app: cashflow
    spec:
      containers:
        - name: cashflow
          image: cashflow-sheet:latest
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: cashflow-secrets
```

#### `service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cashflow-service
spec:
  selector:
    app: cashflow
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

#### `ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cashflow-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: cashflow.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: cashflow-service
                port:
                  number: 80
```

---

## 7. Rencana Pengembangan (Phase Roadmap)

### Phase 1: Database & API (The Core)

**Tujuan:** Koneksi ke Google Sheets berfungsi.

| Task | Detail |
|------|--------|
| Setup Google Cloud Project | Buat GCP Project, aktifkan Sheets API |
| Buat Service Account | Download credentials JSON |
| Share Google Sheet | Berikan akses Editor ke email Service Account |
| Buat API Route GET | `/api/transactions` mengembalikan data dari sheet |
| Buat API Route POST | `/api/transactions` menulis data baru ke sheet |
| Unit test API routes | Pastikan response sesuai schema |

**Definition of Done:** Data bisa dibaca dan ditulis via API Route.

---

### Phase 2: UI & Multi-User Logic (The App)

**Tujuan:** Dashboard berfungsi penuh dengan multi-user.

| Task | Detail |
|------|--------|
| Setup SvelteKit project | Dengan Tailwind CSS & shadcn-svelte |
| Buat komponen KPICard | Tampil Saldo, Pemasukan, Pengeluaran |
| Buat ProfileSwitcher | Dropdown 4 user, simpan ke localStorage |
| Buat TransactionForm | Form input + validasi client-side |
| Integrasi Chart | Line, Pie, Bar chart dari data terfilter |
| Filter logika | `data.filter(item => item.user === selectedUser)` |

**Definition of Done:** Dashboard menampilkan data real dari Sheets, filter user berfungsi.

---

### Phase 3: Dockerization (The Container)

**Tujuan:** Aplikasi berjalan di Docker.

| Task | Detail |
|------|--------|
| Buat Dockerfile | Multi-stage build dengan Node 20 Alpine |
| Build image | `docker build -t cashflow-sheet:latest .` |
| Test container | `docker run -p 3000:3000 --env-file .env cashflow-sheet:latest` |
| Buat docker-compose.yml | Untuk kemudahan development |

**Definition of Done:** Aplikasi dapat diakses di `localhost:3000` melalui Docker.

---

### Phase 4: Kubernetes Orchestration (The Ops)

**Tujuan:** Aplikasi berjalan di cluster Kubernetes lokal.

| Task | Detail |
|------|--------|
| Setup k3d | `k3d cluster create family-cashflow` |
| Load image ke k3d | `k3d image import cashflow-sheet:latest -c family-cashflow` |
| Apply manifests | `kubectl apply -f k8s/` |
| Setup Ingress | Akses via `cashflow.local` (edit `/etc/hosts`) |
| End-to-end test | Verifikasi semua fitur berfungsi di Kubernetes |

**Definition of Done:** Aplikasi dapat diakses di `http://cashflow.local`.

---

## 8. Skema Validasi Data

### Input Transaksi

| Field    | Aturan Validasi                                     |
|----------|-----------------------------------------------------|
| tanggal  | Wajib, format `YYYY-MM-DD`, tidak boleh lebih dari hari ini |
| tipe     | Wajib, hanya `Income` atau `Expense`               |
| kategori | Wajib, harus dari daftar kategori yang valid        |
| nominal  | Wajib, angka positif, minimum 1                     |
| user     | Wajib, hanya `Papa`, `Mama`, atau `Ara`             |
| catatan  | Opsional, maksimum 200 karakter                     |

---

## 9. Pertimbangan Keamanan

| Area                    | Kebijakan                                                              |
|-------------------------|------------------------------------------------------------------------|
| Credentials             | Disimpan di `.env` / Kubernetes Secret, **tidak pernah di-hardcode**   |
| `.gitignore`            | `.env` wajib masuk `.gitignore`                                       |
| Google Sheets access    | Service Account hanya punya akses ke sheet yang diperlukan            |
| Input validation        | Semua input divalidasi server-side sebelum ditulis ke Sheets          |
| CORS                    | Batasi origin jika diakses dari domain lain                           |
| Rate limiting           | Pertimbangkan rate limit untuk mencegah spam ke Sheets API            |

---

## 10. Glossary

| Istilah          | Definisi                                                         |
|------------------|------------------------------------------------------------------|
| KPI Card         | Kartu metrik kunci yang menampilkan angka ringkasan              |
| Profile Switcher | Komponen UI untuk memilih user aktif                             |
| Identity Tagging | Pencatatan otomatis nama user aktif pada setiap transaksi        |
| Service Account  | Akun Google Cloud untuk autentikasi server-side tanpa login UI   |
| k3d              | Tool untuk menjalankan k3s (Kubernetes) di dalam Docker          |
| Multi-stage build| Teknik Docker untuk mengoptimalkan ukuran image final            |
| Income           | Pemasukan / uang yang diterima                                   |
| Expense          | Pengeluaran / uang yang dikeluarkan                              |

---

*PRD ini adalah panduan lengkap untuk development Family CashFlow-Sheet, mulai dari coding frontend hingga deployment di Kubernetes lokal.*