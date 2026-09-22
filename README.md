```markdown
# Backend Sistem Informasi Persuratan

Backend API untuk aplikasi **Sistem Informasi Persuratan PT Metanouva Informatika**. Dibangun dengan Node.js + Express.js + MySQL, menggunakan Knex.js sebagai query builder dan JWT untuk autentikasi.

Dokumen ini menjelaskan cara instalasi, menjalankan, dan daftar endpoint yang tersedia.

---

## 📋 Daftar Isi

- [Teknologi](#-teknologi)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Menjalankan Server](#-menjalankan-server)
- [Struktur Folder](#-struktur-folder)
- [Akun Testing](#-akun-testing)
- [Daftar Endpoint](#-daftar-endpoint)
- [Dua Jenis Input Surat Keluar](#-dua-jenis-input-surat-keluar)
- [Dokumentasi Hasil](#-dokumentasi-hasil)
- [Kontrak API](#-kontrak-api)
- [Catatan Pengembangan](#-catatan-pengembangan)

---

## 🛠 Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Runtime | Node.js v20+ |
| Framework | Express.js |
| Database | MySQL 8+ |
| Query Builder | Knex.js |
| Autentikasi | JWT (jsonwebtoken) |
| Hashing Password | bcrypt |
| Upload File | Multer |
| Generate PDF | Puppeteer |

---

## ✅ Prasyarat

Pastikan sudah terinstall di komputer:

- **Node.js** v20 atau lebih baru ([download](https://nodejs.org))
- **MySQL** (via XAMPP/Laragon/MySQL Community Server)
- **Git** untuk clone repository
- **VS Code** (disarankan)

Cek versi Node.js:
```bash
node -v
```

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/GinaQurrotaAeny29/backend_sistem_persuratan.git
cd backend_sistem_persuratan
```

### 2. Install Dependencies

```bash
npm install
```

Proses ini akan mengunduh semua library, termasuk Chromium untuk Puppeteer (bisa 2–5 menit).

### 3. Buat File `.env`

Copy dari `.env.example`, lalu sesuaikan:

```bash
cp .env.example .env
```

Isi `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=si_persuratan
JWT_SECRET=rahasia_backend_2026
JWT_EXPIRES=8h
```

> **Catatan:** Jika MySQL kamu punya password, isi `DB_PASS` sesuai.

### 4. Buat Database di MySQL

Buka phpMyAdmin (`http://localhost/phpmyadmin`) atau terminal MySQL:

```sql
CREATE DATABASE si_persuratan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Jalankan Migrasi & Seeder

```bash
npx knex migrate:latest
npx knex seed:run
```

Perintah ini akan membuat semua tabel dan mengisi data awal (admin, pegawai, bagian, jenis surat, pengaturan penomoran).

---

## ▶️ Menjalankan Server

```bash
npm run dev
```

Server akan berjalan di: **`http://localhost:3000`**

Cek kesehatan server:
```
GET http://localhost:3000/health
```

Response: `{ "success": true, "message": "Server sehat" }`

---

## 📁 Struktur Folder

```
backend-si-persuratan/
├── src/
│   ├── config/
│   │   └── db.js                    # Koneksi ke MySQL via Knex
│   ├── middlewares/
│   │   ├── authenticate.js          # Verifikasi token JWT
│   │   ├── authorize.js             # Cek role (admin/pegawai)
│   │   └── upload.js                # Upload file via Multer
│   ├── modules/
│   │   ├── auth/                    # Login, profil, ganti password
│   │   ├── surat-masuk/             # CRUD surat masuk + upload
│   │   ├── disposisi/               # Buat, baca, ubah status disposisi
│   │   ├── notifikasi/              # Notifikasi in-app
│   │   ├── users/                   # Kelola akun pengguna
│   │   ├── pegawai/                 # Kelola data pegawai
│   │   ├── bagian/                  # Master bagian
│   │   ├── jenis-surat/             # Master jenis surat
│   │   ├── template/                # Master template + field dinamis
│   │   ├── penomoran/               # Aturan penomoran surat keluar
│   │   └── surat-keluar/            # Buat surat keluar + generate PDF
│   ├── utils/
│   │   ├── generateAgenda.js        # Generate nomor agenda surat masuk
│   │   ├── generateNomorSurat.js    # Generate nomor surat keluar (FOR UPDATE)
│   │   ├── renderPDF.js             # Render HTML → PDF (Puppeteer)
│   │   └── romawi.js                # Konversi bulan ke angka Romawi
│   ├── migrations/                  # File migrasi Knex
│   ├── seeds/                       # File seeder Knex
│   ├── app.js                       # Konfigurasi Express + middleware
│   └── server.js                    # Entry point server
├── storage/                         # File upload (di-ignore dari Git)
├── docs/                            # Dokumentasi hasil (PDF, screenshot)
├── knexfile.js
├── .env                             # Variabel lingkungan (di-ignore)
├── .env.example                     # Template variabel lingkungan
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Akun Testing

Data ini otomatis terisi setelah menjalankan seeder.

| Role | Username | Password | Nama |
|------|----------|----------|------|
| Admin | `rina.marlina` | `admin123` | Rina Marlina |
| Pegawai | `budi.santoso` | `pegawai123` | Budi Santoso |

> **Catatan:** Password di-hash dengan bcrypt (cost 10).

---

## 📡 Daftar Endpoint

**Base URL:** `http://localhost:3000/api`

Semua endpoint kecuali `POST /auth/login` membutuhkan header:
```
Authorization: Bearer <token>
```

### 🔑 Auth

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | `/auth/login` | Publik | Login, dapat token JWT |
| GET | `/auth/me` | Auth | Ambil profil user yang login |
| PATCH | `/auth/password` | Auth | Ganti kata sandi |
| POST | `/auth/logout` | Auth | Logout (hapus token di klien) |

### 📥 Surat Masuk

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/surat-masuk` | Auth | Daftar surat masuk |
| POST | `/surat-masuk` | Admin | Tambah surat (multipart, field `file`) |
| GET | `/surat-masuk/:id` | Auth | Detail surat + disposisi + balasan |
| GET | `/surat-masuk/:id/file` | Auth | Unduh berkas PDF |
| PATCH | `/surat-masuk/:id/surat-balasan` | Admin | Tautkan surat keluar sebagai balasan |
| DELETE | `/surat-masuk/:id/surat-balasan` | Admin | Hapus tautan balasan |

### 📤 Disposisi

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | `/surat-masuk/:id/disposisi` | Admin | Buat disposisi baru |
| GET | `/disposisi/saya` | Pegawai | Disposisi untuk pegawai yang login |
| GET | `/disposisi/:id` | Auth | Detail disposisi |
| PATCH | `/disposisi/:id/baca` | Pegawai | Tandai sudah dibaca (idempotent) |
| PATCH | `/disposisi/:id/status` | Pegawai | Ubah status (`diproses`/`selesai`) |
| GET | `/disposisi/:id/riwayat` | Auth | Riwayat perubahan status |

### 🔔 Notifikasi

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/notifikasi` | Auth | Daftar notifikasi + hitungan belum dibaca |
| PATCH | `/notifikasi/baca-semua` | Auth | Tandai semua sudah dibaca |

### 👥 Users (Akun Login)

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/users` | Admin | Daftar user (filter `?role=&q=`) |
| GET | `/users/:id` | Admin | Detail user |
| POST | `/users` | Admin | Tambah user (body `password_awal`) |
| PUT | `/users/:id` | Admin | Ubah user (password kosong = tidak diubah) |
| PATCH | `/users/:id/status` | Admin | Aktif/nonaktifkan user |

### 🧑‍💼 Pegawai

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/pegawai` | Admin | Daftar pegawai |
| GET | `/pegawai/:id` | Admin | Detail pegawai |
| POST | `/pegawai` | Admin | Tambah pegawai (`user_id` opsional) |
| PUT | `/pegawai/:id` | Admin | Ubah pegawai |
| PATCH | `/pegawai/:id/status` | Admin | Aktif/nonaktifkan pegawai |
| GET | `/pegawai/penerima-disposisi` | Admin | Dropdown pegawai penerima disposisi |

### 🏢 Master Data

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET/POST | `/master/bagian` | Admin | Master bagian |
| GET/PUT/PATCH | `/master/bagian/:id` | Admin | Detail/ubah/status bagian |
| GET/POST | `/master/jenis-surat` | Admin | Master jenis surat |
| GET/PUT/PATCH | `/master/jenis-surat/:id` | Admin | Detail/ubah/status jenis surat |
| GET/POST | `/master/template` | Admin | Master template surat |
| GET/PUT/PATCH | `/master/template/:id` | Admin | Detail/ubah/status template |
| GET/POST | `/master/template/:id/fields` | Admin | Field dinamis template |
| PUT/DELETE | `/master/template/:id/fields/:fieldId` | Admin | Ubah/hapus field |
| GET/PUT | `/master/penomoran` | Admin | Aturan penomoran surat keluar |

### 📨 Surat Keluar

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/surat-keluar` | Admin | Daftar surat keluar (filter `?jenis_input=`) |
| POST | `/surat-keluar` | Admin | Buat surat (generate nomor + PDF) |
| GET | `/surat-keluar/:id` | Admin | Detail surat + disposisi terkait |
| GET | `/surat-keluar/:id/file` | Admin | Unduh PDF surat keluar |
| GET | `/surat-keluar/tersedia` | Admin | Surat keluar yang belum jadi balasan |

---

## ✨ Dua Jenis Input Surat Keluar

Sesuai arahan pembimbing, endpoint `POST /api/surat-keluar` mendukung **dua jenis input**:

### 1. Surat Baru (`jenis_input: "baru"`)

- Nomor surat **di-generate otomatis** oleh sistem.
- Counter **bertambah** setiap kali surat dibuat.
- Format: `{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}`.
- Contoh: `006/FIN.03/Digitak/IX/2026`.

**Request:**
```json
{
  "jenis_input": "baru",
  "template_id": 3,
  "tanggal_surat": "2026-09-15",
  "kepada": "PT ABC",
  "perihal": "Surat Baru Test",
  "data_dinamis": { "kepada": "PT ABC" }
}
```

### 2. Surat Lama (`jenis_input: "lama"`)

- Nomor surat **diisi manual** oleh admin.
- Counter **TIDAK bertambah** (untuk input data historis).
- Berguna saat migrasi data lama dari Excel.
- Contoh: `145/MI/DIR.01/III/2024`.

**Request:**
```json
{
  "jenis_input": "lama",
  "nomor_surat_manual": "145/MI/DIR.01/III/2024",
  "template_id": 3,
  "tanggal_surat": "2024-03-15",
  "kepada": "PT XYZ",
  "perihal": "Surat Lama Historis",
  "data_dinamis": { "kepada": "PT XYZ" }
}
```

### Perbandingan

| Aspek | Surat Baru | Surat Lama |
|-------|-----------|-----------|
| `jenis_input` | `"baru"` | `"lama"` |
| Nomor | Otomatis dari counter | Manual dari `nomor_surat_manual` |
| Counter | Bertambah | Tidak bertambah |
| `nomor_urut` | Terisi (integer) | `null` |
| Duplikasi nomor | Dijamin unik oleh counter | Dicek 409 jika sudah ada |

### Detail Surat Keluar + Disposisi

Endpoint `GET /api/surat-keluar/:id` mengembalikan field `disposisi[]` yang berisi daftar disposisi dari **surat masuk yang dibalas** (jika surat keluar ini adalah balasan). Frontend bisa menampilkan section "Disposisi Terkait" di halaman detail surat keluar, dengan tombol route ke halaman detail disposisi.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nomor_surat": "001/FIN.03/Digitak/IX/2026",
    "membalas_surat_masuk": {
      "id": 4,
      "nomor_agenda": "0001/2026",
      "perihal": "Undangan Rapat Koordinasi"
    },
    "disposisi": [
      {
        "id": 1,
        "instruksi": "Mohon disiapkan surat balasan",
        "batas_waktu": "2026-09-20",
        "status": "selesai",
        "terlambat": false,
        "pemberi": { "id": 1, "nama": "Rina Marlina" },
        "penerima": { "id": 2, "nama": "Budi Santoso" }
      }
    ]
  }
}
```

---

## 🎬 Dokumentasi Hasil

### 1. Contoh Surat Keluar (PDF)

Berikut adalah contoh hasil generate PDF dari endpoint `POST /api/surat-keluar` menggunakan template "Surat Undangan Rapat":

![Contoh Surat Keluar](docs/contoh-surat-keluar.png)

📄 **[Download contoh PDF lengkap](docs/contoh-surat-keluar.pdf)**

**Endpoint yang dipakai:**
```http
POST /api/surat-keluar
Authorization: Bearer <token>
Content-Type: application/json

{
  "jenis_input": "baru",
  "template_id": 3,
  "tanggal_surat": "2026-09-14",
  "kepada": "PT Fiber Media Indonesia",
  "perihal": "Undangan Rapat Koordinasi",
  "pic": "Riski",
  "data_dinamis": {
    "kepada": "PT Fiber Media Indonesia",
    "tanggal": "2026-09-20",
    "agenda": "Pembahasan Proyek Q4"
  }
}
```

**Hasil:**
- Nomor surat otomatis: `001/FIN.03/Digitak/IX/2026`
- PDF: lihat file di `docs/contoh-surat-keluar.pdf`
- File tersimpan di server: `storage/surat-keluar/`

---

### 2. Contoh Response API

#### A. Login Berhasil

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "rina.marlina",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nama": "Rina Marlina",
      "username": "rina.marlina",
      "role": "admin",
      "jabatan": "Kepala Administrasi",
      "bagian": { "id": 1, "kode": "FIN", "nama": "Keuangan" },
      "status": "aktif"
    }
  }
}
```

#### B. Daftar Surat Masuk

```http
GET /api/surat-masuk
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nomor_agenda": "0001/2026",
      "nomor_surat": "005/ITG/A.5/B/IX/2026",
      "tanggal_surat": "2026-09-14",
      "perihal": "Undangan Rapat Koordinasi",
      "pengirim": "Dinas Pendidikan",
      "pic": "Ahmad Abdullah",
      "file_name": "dummy-surat.pdf"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "total_page": 1 }
}
```

#### C. Buat Disposisi

```http
POST /api/surat-masuk/1/disposisi
Authorization: Bearer <token>
Content-Type: application/json

{
  "pegawai_id": 2,
  "instruksi": "Mohon disiapkan surat balasan",
  "batas_waktu": "2026-09-20"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Disposisi berhasil dibuat",
  "data": {
    "id": 1,
    "surat_masuk_id": 1,
    "dari_pegawai_id": 1,
    "kepada_pegawai_id": 2,
    "instruksi": "Mohon disiapkan surat balasan",
    "batas_waktu": "2026-09-20",
    "status": "belum_dibaca"
  }
}
```

#### D. Generate Surat Keluar (Surat Baru)

```http
POST /api/surat-keluar
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Surat keluar berhasil dibuat",
  "data": {
    "id": 1,
    "jenis_input": "baru",
    "nomor_urut": 1,
    "nomor_surat": "001/FIN.03/Digitak/IX/2026",
    "tahun": 2026,
    "tanggal_surat": "2026-09-14",
    "kepada": "PT Fiber Media Indonesia",
    "perihal": "Undangan Rapat Koordinasi",
    "pic": "Riski",
    "data_dinamis": {
      "kepada": "PT Fiber Media Indonesia",
      "tanggal": "2026-09-20",
      "agenda": "Pembahasan Proyek Q4"
    }
  }
}
```

#### E. Simpan Surat Lama

```http
POST /api/surat-keluar
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Surat lama berhasil disimpan",
  "data": {
    "id": 7,
    "jenis_input": "lama",
    "nomor_urut": null,
    "nomor_surat": "145/MI/DIR.01/III/2024",
    "nomor_surat_manual": "145/MI/DIR.01/III/2024",
    "tahun": 2024,
    "tanggal_surat": "2024-03-15",
    "kepada": "PT XYZ",
    "perihal": "Surat Lama Historis"
  }
}
```

---

### 3. Contoh Format Penomoran

| Jenis | Contoh | Keterangan |
|-------|--------|------------|
| **Nomor Agenda Surat Masuk** | `0001/2026` | Format `NNNN/TAHUN`, counter per tahun |
| **Nomor Surat Keluar** | `001/FIN.03/Digitak/IX/2026` | Format `{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}` |
| **Bulan Romawi** | `I` s.d. `XII` | Diambil dari `tanggal_surat`, bukan tanggal hari ini |

**Aturan:**
- Counter global per tahun — semua bagian berbagi satu urutan.
- Nomor hanya diambil saat disimpan, bukan saat pratinjau.
- Transaksi terkunci (`SELECT ... FOR UPDATE`) untuk mencegah duplikasi.
- Surat lama tidak mempengaruhi counter.

---

### 4. Contoh Alur Lengkap

```
1. Admin login                     → POST /api/auth/login
2. Admin upload surat masuk        → POST /api/surat-masuk
3. Admin buat disposisi            → POST /api/surat-masuk/:id/disposisi
4. Pegawai lihat disposisi         → GET /api/disposisi/saya
5. Pegawai tandai dibaca           → PATCH /api/disposisi/:id/baca
6. Pegawai ubah status ke proses   → PATCH /api/disposisi/:id/status
7. Admin buat surat balasan        → POST /api/surat-keluar (jenis_input: baru)
8. Admin tautkan balasan           → PATCH /api/surat-masuk/:id/surat-balasan
9. Admin download PDF              → GET /api/surat-keluar/:id/file
```

---

## 📖 Kontrak API

Semua endpoint mengikuti **Kontrak API v1.1** yang disepakati bersama tim frontend.

**Format response sukses:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 134, "total_page": 14 }
}
```

**Format response gagal:**
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    { "field": "nomor_surat", "message": "Nomor surat wajib diisi" }
  ]
}
```

**Kode status HTTP:**
| Kode | Arti |
|------|------|
| 200 | Sukses |
| 201 | Resource dibuat |
| 400 / 422 | Validasi gagal |
| 401 | Token tidak ada / expired |
| 403 | Role tidak berhak |
| 404 | Tidak ditemukan |
| 409 | Konflik (duplikat, nomor ganda, balasan ganda) |
| 413 | File melebihi 10 MB |
| 500 | Error server |

---

## 📝 Catatan Pengembangan

### Menjalankan Seeder Tertentu

Jangan jalankan `npx knex seed:run` jika tidak ingin menghapus semua data. Gunakan `--specific`:

```bash
npx knex seed:run --specific=02_app_setting_default.js
```

### Reset Database

Untuk reset total (hapus semua data + migrasi ulang):

```bash
npx knex migrate:rollback --all
npx knex migrate:latest
npx knex seed:run
```

### Upload File PDF (Testing)

Karena Thunder Client versi gratis tidak support upload file, gunakan `curl`:

```bash
curl.exe -X POST http://localhost:3000/api/surat-masuk ^
  -H "Authorization: Bearer <token>" ^
  -F "nomor_surat=005/ITG/A.5/B/IX/2026" ^
  -F "tanggal_surat=2026-09-14" ^
  -F "pengirim=Dinas Pendidikan" ^
  -F "perihal=Undangan Rapat" ^
  -F "file=@C:\path\to\file.pdf"
```

### Download File PDF

```bash
curl.exe -X GET http://localhost:3000/api/surat-keluar/1/file ^
  -H "Authorization: Bearer <token>" ^
  --output hasil.pdf
```

### Penomoran Otomatis

- **Surat masuk:** nomor agenda otomatis dengan format `NNNN/TAHUN` (contoh: `0001/2026`).
- **Surat keluar:** nomor otomatis dengan pola `{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}` (contoh: `001/FIN.03/Digitak/IX/2026`).
- Counter di-key per tahun, menggunakan transaksi terkunci (`SELECT ... FOR UPDATE`) untuk mencegah duplikasi.
- Nomor **hanya** diambil saat surat disimpan, bukan saat pratinjau.
- **Surat lama tidak mempengaruhi counter** — nomor diisi manual.

### Generate PDF

Menggunakan **Puppeteer** (Chromium headless). Browser instance diluncurkan sekali dan di-cache untuk efisiensi.

Kalau ada error Chromium, jalankan:
```bash
npx puppeteer browsers install chrome
```

---

## 📞 Kontak

Jika ada pertanyaan atau kendala terkait backend, hubungi tim backend.

---

**© 2026 PT Metanouva Informatika — Kerja Praktik**
```

---

## 📌 Yang Baru di README Ini

| Perubahan | Keterangan |
|-----------|------------|
| **Daftar Isi** | Tambah "Dua Jenis Input Surat Keluar" & "Dokumentasi Hasil" |
| **Struktur Folder** | Tambah `docs/` |
| **Endpoint Surat Keluar** | Tambah keterangan filter `?jenis_input=` & disposisi di detail |
| **Section "Dua Jenis Input Surat Keluar"** | Section baru — penjelasan lengkap surat baru vs lama |
| **Section "Dokumentasi Hasil"** | Section baru — screenshot PDF, contoh response, format penomoran, alur lengkap |
| **Catatan Penomoran** | Tambah: surat lama tidak mempengaruhi counter |

---

## 📤 Setelah Update

1. Simpan file `README.md`.
2. Commit & push:
   ```bash
   git add README.md
   git commit -m "Update: README dengan fitur dua jenis surat keluar + dokumentasi hasil"
   git push
   ```

---
