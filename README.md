# Backend Sistem Informasi Persuratan

Backend API untuk aplikasi **Sistem Informasi Persuratan PT Metanouva Informatika**. Dibangun dengan Node.js + Express.js + MySQL, menggunakan Knex.js sebagai query builder, JWT untuk autentikasi, dan Puppeteer untuk generasi PDF surat keluar.

Proyek ini merupakan **studi kasus** kerja praktik — simulasi pengembangan sistem persuratan digital seperti yang biasa dikerjakan PT Metanouva Informatika untuk klien mereka.

---

## 📋 Daftar Isi

1. [Teknologi](#-teknologi)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur Sistem](#-arsitektur-sistem)
4. [Struktur Folder](#-struktur-folder)
5. [Skema Database](#-skema-database)
6. [Prasyarat](#-prasyarat)
7. [Instalasi](#-instalasi)
8. [Menjalankan Server](#-menjalankan-server)
9. [Akun Testing](#-akun-testing)
10. [Daftar Endpoint](#-daftar-endpoint)
11. [Aturan Bisnis](#-aturan-bisnis)
12. [Fitur Unggulan](#-fitur-unggulan)
13. [Deployment](#-deployment)
14. [Catatan Pengembangan](#-catatan-pengembangan)
15. [Kontak](#-kontak)

---

## 🛠 Teknologi

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | Node.js | v20+ |
| Framework | Express.js | 5.x |
| Database | MySQL / MariaDB | 8.x |
| Query Builder | Knex.js | 3.x |
| Autentikasi | JSON Web Token (JWT) | 9.x |
| Hashing Password | bcrypt | 6.x |
| Upload File | Multer | 2.x |
| Generate PDF | Puppeteer | 25.x |
| Validasi | Manual + Zod (opsional) | — |
| Logging | Morgan | 1.x |
| Security | Helmet, CORS | — |
| Environment | dotenv | 17.x |

---

## ✨ Fitur Utama

Sistem backend ini menyediakan **40+ endpoint API** yang terbagi dalam **11 modul**:

1. **Autentikasi** — Login JWT, profil user, ganti password
2. **Surat Masuk** — Registrasi, upload PDF, penomoran agenda otomatis, taut surat balasan
3. **Surat Keluar** — Generate nomor otomatis, render PDF, dua jenis input (baru & lama)
4. **Disposisi** — Buat disposisi, tandai dibaca, ubah status, riwayat perubahan
5. **Notifikasi** — Notifikasi in-app untuk pegawai
6. **Users** — CRUD akun login dengan role admin/pegawai
7. **Pegawai** — CRUD data pegawai (terpisah dari users)
8. **Bagian** — Master data bagian/departemen
9. **Jenis Surat** — Master data jenis surat (44 jenis sesuai panduan)
10. **Template** — Template surat + field dinamis
11. **Penomoran** — Aturan penomoran + counter + riwayat perubahan

---

## 🏗 Arsitektur Sistem

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│     FRONTEND        │         │      BACKEND         │         │    DATABASE     │
│  React.js + Vite    │────────▶│  Node.js + Express   │────────▶│  MySQL / MariaDB│
│   (Vercel)          │◀────────│  (Lokal + Tunnel)    │◀────────│                 │
└─────────────────────┘   HTTP  └──────────────────────┘   SQL   └─────────────────┘
                                        │
                                        │
                                        ▼
                                 ┌──────────────────────┐
                                 │     PUPPETEER        │
                                 │  (Generate PDF)      │
                                 │  Chromium Headless   │
                                 └──────────────────────┘
```

**Prinsip Arsitektur:**

- **Stateless API** — Menggunakan JWT, tidak ada session di server
- **RESTful** — Endpoint mengikuti konvensi REST
- **Contract-First** — Kontrak API disepakati sebelum coding
- **Separation of Concerns** — Controller, service, middleware terpisah

---

## 📁 Struktur Folder

```
backend_sistem_persuratan/
├── src/
│   ├── config/
│   │   └── db.js                    # Koneksi MySQL via Knex
│   ├── middlewares/
│   │   ├── authenticate.js          # Verifikasi JWT
│   │   ├── authorize.js             # Cek role (admin/pegawai)
│   │   └── upload.js                # Upload file via Multer
│   ├── modules/
│   │   ├── auth/                    # Login, profil, ganti password
│   │   ├── surat-masuk/             # CRUD surat masuk + upload
│   │   ├── surat-keluar/            # CRUD surat keluar + PDF
│   │   ├── disposisi/               # Alur disposisi
│   │   ├── notifikasi/              # Notifikasi in-app
│   │   ├── users/                   # Kelola akun login
│   │   ├── pegawai/                 # Kelola data pegawai
│   │   ├── bagian/                  # Master bagian
│   │   ├── jenis-surat/             # Master jenis surat
│   │   ├── template/                # Master template + field dinamis
│   │   └── penomoran/               # Aturan penomoran
│   ├── utils/
│   │   ├── generateAgenda.js        # Nomor agenda surat masuk
│   │   ├── generateNomorSurat.js    # Nomor surat keluar (FOR UPDATE)
│   │   ├── renderPDF.js             # HTML → PDF (Puppeteer)
│   │   └── romawi.js                # Konversi bulan ke Romawi
│   ├── migrations/                  # File migrasi Knex
│   ├── seeds/                       # File seeder Knex
│   ├── scripts/                     # Script bantu (debug, perbaikan)
│   ├── app.js                       # Konfigurasi Express + middleware
│   └── server.js                    # Entry point server
├── storage/                         # File upload & PDF (git-ignored)
│   ├── public/
│   │   └── logo.png                 # Logo perusahaan
│   ├── surat-masuk/                 # File PDF surat masuk
│   └── surat-keluar/                # File PDF surat keluar
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Template environment
├── .gitignore
├── knexfile.js                      # Konfigurasi Knex
├── puppeteer.config.cjs             # Konfigurasi Puppeteer
├── package.json
└── README.md
```

---

## 🗄 Skema Database

Database terdiri dari **14 tabel** yang saling terhubung:

### Tabel Master

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Akun login (username, password_hash, role, status) |
| `pegawai` | Data pegawai (terpisah dari users) |
| `bagian` | Master bagian/departemen (FIN, DIR, HR, ADM, MKT, ENG) |
| `jenis_surat` | Master jenis surat (44 jenis sesuai panduan) |
| `template_surat` | Template surat dengan konten HTML |
| `template_field` | Field dinamis untuk setiap template |
| `app_setting` | Pengaturan aplikasi (key-value) |

### Tabel Transaksi

| Tabel | Deskripsi |
|-------|-----------|
| `surat_masuk` | Data surat masuk + file + nomor agenda |
| `surat_keluar` | Data surat keluar + nomor + PDF |
| `disposisi` | Disposisi surat dari admin ke pegawai |
| `riwayat_disposisi` | Audit log perubahan status disposisi |
| `notifikasi` | Notifikasi in-app |
| `counter` | Counter penomoran (per tahun) |
| `riwayat_penomoran` | Riwayat perubahan aturan penomoran |

### Relasi Kunci

- `surat_masuk.dibuat_oleh` → `users.id`
- `disposisi.surat_masuk_id` → `surat_masuk.id`
- `disposisi.dari_pegawai_id` → `pegawai.id`
- `disposisi.kepada_pegawai_id` → `pegawai.id`
- `surat_keluar.membalas_surat_masuk_id` → `surat_masuk.id`
- `pegawai.user_id` → `users.id` (opsional, K-11)

---

## ✅ Prasyarat

Pastikan sudah terinstall di komputer:

- **Node.js** v20 atau lebih baru — [download](https://nodejs.org)
- **MySQL** (via XAMPP / Laragon / MySQL Community Server)
- **Git** untuk version control
- **VS Code** (disarankan)

Cek versi Node.js:
```bash
node -v
```

Cek versi npm:
```bash
npm -v
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

Proses ini akan mengunduh semua library, termasuk **Chromium untuk Puppeteer** (bisa 2–5 menit tergantung koneksi).

### 3. Buat File `.env`

Copy dari `.env.example`:

```bash
cp .env.example .env
```

Isi `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=si_persuratan
DB_SSL=false

# JWT
JWT_SECRET=rahasia_backend_2026
JWT_EXPIRES=8h
```

> **Catatan:** 
> - Jika MySQL kamu punya password, isi `DB_PASS` sesuai.
> - Kalau pakai database cloud (TiDB Cloud), set `DB_SSL=true` dan `DB_PORT=4000`.

### 4. Buat Database di MySQL

Buka **phpMyAdmin** (`http://localhost/phpmyadmin`) atau terminal MySQL:

```sql
CREATE DATABASE si_persuratan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Jalankan Migrasi

```bash
npx knex migrate:latest
```

Perintah ini akan membuat **14 tabel** di database.

### 6. Isi Data Awal (Seeder)

```bash
npx knex seed:run
```

Data awal yang akan dibuat:
- **Admin**: `rina.marlina` / `admin123`
- **Pegawai**: `budi.santoso` / `pegawai123`
- **Bagian**: FIN, DIR, HR, ADM, MKT, ENG
- **Jenis Surat**: 44 jenis sesuai panduan
- **Template**: 44 template + field dinamis
- **Pengaturan**: Format nomor, kode perusahaan, dll.

### 7. Siapkan Logo Perusahaan

Letakkan file logo di:
```
storage/public/logo.png
```

Logo ini akan otomatis muncul di kop surat PDF.

### 8. Jalankan Server

```bash
npm run dev
```

Server akan berjalan di: **`http://localhost:3000`**

---

## ▶️ Menjalankan Server

### Mode Development (dengan auto-reload)

```bash
npm run dev
```

### Mode Production

```bash
npm start
```

### Cek Kesehatan Server

Buka browser: `http://localhost:3000/health`

**Response:**
```json
{ "success": true, "message": "Server sehat" }
```

---

## 🔐 Akun Testing

Data ini otomatis terisi setelah menjalankan seeder.

| Role | Username | Password | Nama |
|------|----------|----------|------|
| **Admin** | `rina.marlina` | `admin123` | Rina Marlina |
| **Pegawai** | `budi.santoso` | `pegawai123` | Budi Santoso |

> **Catatan:** Password di-hash dengan **bcrypt** (cost 10). Tidak pernah muncul di response API.

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
| GET | `/surat-masuk` | Auth | Daftar surat masuk + filter |
| POST | `/surat-masuk` | Admin | Tambah surat (multipart, field `file`) |
| GET | `/surat-masuk/:id` | Auth | Detail surat + disposisi + balasan |
| GET | `/surat-masuk/:id/file` | Auth | Unduh berkas PDF |
| PATCH | `/surat-masuk/:id/surat-balasan` | Admin | Tautkan surat keluar sebagai balasan |
| DELETE | `/surat-masuk/:id/surat-balasan` | Admin | Hapus tautan balasan |

**Query parameter untuk `GET /surat-masuk`:**
- `q` — Cari di nomor_surat, perihal, pengirim
- `status` — Filter: `belum_dibaca`, `diproses`, `selesai`, `belum_didisposisi`
- `tanggal_dari`, `tanggal_sampai` — Filter rentang tanggal
- `page`, `limit` — Pagination

### 📤 Disposisi

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| POST | `/surat-masuk/:id/disposisi` | Admin | Buat disposisi baru |
| GET | `/disposisi` | Admin | Daftar semua disposisi |
| GET | `/disposisi/saya` | Pegawai | Disposisi untuk pegawai yang login |
| GET | `/disposisi/:id` | Auth | Detail disposisi |
| PATCH | `/disposisi/:id/baca` | Pegawai | Tandai sudah dibaca (idempotent) |
| PATCH | `/disposisi/:id/status` | Pegawai | Ubah status |
| GET | `/disposisi/:id/riwayat` | Auth | Riwayat perubahan status |

### 🔔 Notifikasi

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/notifikasi` | Auth | Daftar notifikasi + hitungan belum dibaca |
| PATCH | `/notifikasi/baca-semua` | Auth | Tandai semua sudah dibaca |

### 👥 Users

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/users` | Admin | Daftar user (filter `?role=&q=`) |
| GET | `/users/:id` | Admin | Detail user |
| GET | `/users/tersedia` | Admin | Akun yang belum dipakai pegawai |
| POST | `/users` | Admin | Tambah user baru |
| PUT | `/users/:id` | Admin | Ubah user |
| PATCH | `/users/:id/status` | Admin | Aktif/nonaktifkan user |

### 🧑‍💼 Pegawai

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/pegawai` | Admin | Daftar pegawai |
| GET | `/pegawai/:id` | Admin | Detail pegawai |
| GET | `/pegawai/penerima-disposisi` | Admin | Dropdown penerima disposisi |
| POST | `/pegawai` | Admin | Tambah pegawai |
| PUT | `/pegawai/:id` | Admin | Ubah pegawai |
| PATCH | `/pegawai/:id/status` | Admin | Aktif/nonaktifkan pegawai |

### 🏢 Master Data

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET/POST | `/master/bagian` | Admin | Master bagian |
| GET/PUT/PATCH | `/master/bagian/:id` | Admin | Detail/ubah/status |
| GET/POST | `/master/jenis-surat` | Admin | Master jenis surat |
| GET/PUT/PATCH | `/master/jenis-surat/:id` | Admin | Detail/ubah/status |
| GET/POST | `/master/template` | Admin | Master template |
| GET/PUT/PATCH | `/master/template/:id` | Admin | Detail/ubah/status |
| GET/POST | `/master/template/:id/fields` | Admin | Field dinamis |
| PUT/DELETE | `/master/template/:id/fields/:fieldId` | Admin | Ubah/hapus field |
| GET/PUT | `/master/penomoran` | Admin | Aturan penomoran |

### 📨 Surat Keluar

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| GET | `/surat-keluar` | Admin | Daftar surat keluar |
| POST | `/surat-keluar` | Admin | Buat surat (generate nomor + PDF) |
| GET | `/surat-keluar/:id` | Admin | Detail surat keluar |
| GET | `/surat-keluar/:id/file` | Admin | Unduh PDF surat keluar |
| GET | `/surat-keluar/tersedia` | Admin | Surat keluar yang belum jadi balasan |

---

## 📖 Aturan Bisnis

Sistem ini mengikuti **14 aturan bisnis** yang wajib dijamin server:

| Kode | Aturan |
|------|--------|
| **B-1** | Nomor agenda surat masuk di-generate dalam transaksi terkunci, counter per tahun |
| **B-2** | Nomor surat keluar di-generate dengan `SELECT ... FOR UPDATE` pada counter tahun berjalan |
| **B-3** | `PATCH /disposisi/:id/baca` idempotent — panggilan kedua tidak mengubah apa-apa, tetap 200 |
| **B-4** | `GET` tidak pernah mengubah data |
| **B-5** | Transisi status hanya maju: `belum_dibaca` → `diproses` → `selesai` |
| **B-6** | Setiap perubahan status disposisi menulis baris `riwayat_disposisi` |
| **B-7** | Status `terlambat` dihitung saat query, bukan disimpan sebagai kolom |
| **B-8** | Pegawai hanya boleh baca disposisi & berkas miliknya |
| **B-9** | Satu surat keluar hanya untuk satu surat masuk (409 jika dilanggar) |
| **B-10** | Nonaktifkan user/pegawai/bagian = ubah status, bukan `DELETE` |
| **B-11** | Penerima disposisi = pegawai dengan akun user aktif |
| **B-12** | Bulan Romawi & tahun diambil dari `tanggal_surat` |
| **B-13** | Validasi file dilakukan ulang di server (PDF, max 10 MB) |
| **B-14** | Timestamp dengan zona WIB (+07:00) |

---

## 🎯 Fitur Unggulan

### 1. Penomoran Otomatis dengan Transaksi Terkunci

**Format nomor surat keluar:**
```
001/FIN.03/Digitak/IX/2026
 │    │     │      │   │
 │    │     │      │   └─ Tahun
 │    │     │      └───── Bulan Romawi
 │    │     └──────────── Kode Perusahaan
 │    └────────────────── Bagian.Kode Jenis
 └─────────────────────── Nomor Urut
```

**Keunggulan:**
- ✅ Counter **global per tahun** — reset tiap tahun baru
- ✅ Menggunakan **transaksi terkunci** (`SELECT ... FOR UPDATE`)
- ✅ **Anti-duplikasi** — aman meski 50 request bersamaan
- ✅ Bulan Romawi dari **tanggal surat**, bukan tanggal hari ini

### 2. Generate PDF Otomatis

**Alur:**
```
Template HTML + Data User → Puppeteer (Chromium) → PDF
```

**Fitur:**
- ✅ Template HTML dengan **inline style** (konsisten di preview & PDF)
- ✅ **Field dinamis** — placeholder `{nama}`, `{tanggal}`, `{perihal}`
- ✅ Kop surat + logo perusahaan
- ✅ Format A4, siap cetak
- ✅ Browser di-cache — render kedua lebih cepat

### 3. Dua Jenis Surat Keluar

| Jenis | Nomor | Counter |
|-------|-------|---------|
| **Surat Baru** (`jenis_input: "baru"`) | Otomatis dari sistem | ✅ Bertambah |
| **Surat Lama** (`jenis_input: "lama"`) | Manual dari `nomor_surat_manual` | ❌ Tidak bertambah |

**Manfaat:** Fleksibel untuk migrasi data historis dari Excel.

### 4. Disposisi & Notifikasi

**Alur:**
```
Admin buat disposisi → Pegawai dapat notifikasi in-app
   → Tandai dibaca → Proses → Selesai
```

**Fitur:**
- ✅ Satu disposisi = satu penerima (K-2)
- ✅ Status: `belum_dibaca` → `diproses` → `selesai`
- ✅ Status "terlambat" dihitung otomatis
- ✅ **Audit trail** setiap perubahan status
- ✅ Notifikasi in-app untuk penerima

### 5. Autentikasi JWT (Stateless)

**Keunggulan:**
- ✅ Token-based, tidak ada session di server
- ✅ Server bisa restart tanpa user logout (selama token belum expired)
- ✅ Payload minimal: `{ id, role, pegawai_id }`
- ✅ Expiry 8 jam (configurable)

---

## 🚢 Deployment

### Strategi Deployment

Sistem ini masih menggunakan hosting lokal sebagai berikut: 

| Komponen | Platform | Sifat |
|----------|----------|-------|
| **Frontend** | Local | Deploy cloud, HTTPS otomatis |
| **Backend** | Lokal + Cloudflare Tunnel | Akses publik tanpa cloud server |
| **Database** | MySQL lokal / TiDB Cloud | Untuk demo & produksi |

### Kenapa Backend Tidak di Cloud Gratis?

Fitur **generate PDF dengan Puppeteer** membutuhkan **RAM ≥ 1 GB** (untuk Chromium). Platform hosting gratis umumnya membatasi:
- **Render.com**: 512 MB + wajib kartu kredit
- **Koyeb**: sudah tutup untuk akun baru
- **Railway**: tidak ada free tier murni

**Solusi yang digunakan:** Backend dijalankan **lokal** dan diekspos ke internet menggunakan **Cloudflare Tunnel** (gratis, tanpa kartu kredit).

### Cara Deploy Backend (Cloudflare Tunnel)

1. **Download `cloudflared.exe`** dari [GitHub Cloudflare](https://github.com/cloudflare/cloudflared/releases/latest).

2. **Jalankan backend:**
   ```bash
   npm run dev
   ```

3. **Buka terminal baru, jalankan tunnel:**
   ```bash
   cloudflared.exe tunnel --url http://localhost:3000
   ```

4. **Catat URL publik** yang muncul, contoh:
   ```
   https://abc-xyz-123.trycloudflare.com
   ```

5. **Kirim URL ke tim frontend** untuk di-set di `VITE_API_URL`.

### Cara Deploy Frontend (Vercel)

1. **Buka Vercel**, import repo frontend.
2. **Set environment variable:**
   ```
   VITE_API_URL=https://abc-xyz-123.trycloudflare.com/api
   ```
3. **Redeploy** frontend.

### Untuk Produksi Jangka Panjang

Deploy backend ke **Oracle Cloud Free Tier**:
- **2 OCPU, 12 GB RAM, 200 GB storage**
- **Gratis selamanya** (butuh kartu kredit untuk verifikasi)
- RAM cukup untuk Puppeteer
- Setup dengan Nginx + PM2

---

## 📝 Catatan Pengembangan

### Menjalankan Seeder Tertentu

Jangan jalankan `npx knex seed:run` (semua) jika tidak ingin menghapus data. Gunakan `--specific`:

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

> ⚠️ **PERINGATAN:** Perintah ini akan **menghapus semua data**.

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

### Generate PDF

Jika Puppeteer error `Chromium not found`:

```bash
npx puppeteer browsers install chrome
```

### Struktur Response API

**Sukses:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 134 }
}
```

**Gagal:**
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    { "field": "nomor_surat", "message": "Nomor surat wajib diisi" }
  ]
}
```

### Kode Status HTTP

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

## 🔗 Link Penting

- **Repository Backend**: [github.com/GinaQurrotaAeny29/backend_sistem_persuratan](https://github.com/GinaQurrotaAeny29/backend_sistem_persuratan)
- **Kontrak API**: Lihat file `docs/Kontrak_API_SI_Persuratan.md`
- **Figma Prototype**: 38 layar UI/UX

---

## 📞 Kontak

Untuk pertanyaan atau kendala terkait backend, hubungi:

- **Nama Anngota 1**: Gina Qurrota Aeny (2306029)
- **Nama Anngota 2**: Aisha Kamil Agustina (2306015)
- **Program Studi**: Teknik Informatika
- **Kampus**: Institut Teknologi Garut
- **Email**: 2306029@itg.ac.id | 2306015@itg.ac.id
- **GitHub**: [@GinaQurrotaAeny29](https://github.com/GinaQurrotaAeny29)

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan **Kerja Praktik** di PT Metanouva Informatika.

**© 2026 PT Metanouva Informatika — Kerja Praktik**
```
