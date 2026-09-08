
> **Subject: Backend Siap — Sistem Informasi Persuratan**
>
> ### 🔧 Cara Menjalankan
> ```bash
> git clone https://github.com/GinaQurrotaAeny29/backend_sistem_persuratan.git
> cd backend_sistem_persuratan
> npm install
> ```
>
> Buat file `.env` di root:
> ```env
> PORT=3000
> DB_HOST=localhost
> DB_USER=root
> DB_PASS=
> DB_NAME=si_persuratan
> JWT_SECRET=rahasia_backend_2026
> JWT_EXPIRES=8h
> ```
>
> Jalankan migrasi & seeder:
> ```bash
> npx knex migrate:latest
> npx knex seed:run
> ```
>
> Jalankan server:
> ```bash
> npm run dev
> ```
> Server akan berjalan di `http://localhost:3000`.
>
> ---
>
> ### 🔐 Akun Testing
> | Role | Username | Password |
> |------|----------|----------|
> | Admin | `rina.marlina` | `admin123` |
> | Pegawai | `budi.santoso` | `pegawai123` |
>
> ---
>
> ### 📋 Daftar Endpoint yang Sudah Siap
>
> | Method | Endpoint | Akses | Keterangan |
> |--------|----------|-------|------------|
> | POST | `/api/auth/login` | Publik | Login |
> | GET | `/api/surat-masuk` | Auth | Daftar surat masuk |
> | POST | `/api/surat-masuk` | Admin | Tambah surat masuk (multipart/form-data) |
> | GET | `/api/surat-masuk/:id` | Auth | Detail surat masuk |
> | POST | `/api/surat-masuk/:id/disposisi` | Admin | Buat disposisi |
> | GET | `/api/disposisi/saya` | Pegawai | Disposisi yang diterima |
> | GET | `/api/disposisi/:id` | Auth | Detail disposisi |
> | PATCH | `/api/disposisi/:id/baca` | Pegawai | Tandai sudah dibaca |
> | PATCH | `/api/disposisi/:id/status` | Pegawai | Ubah status (diproses/selesai) |
> | GET | `/api/disposisi/:id/riwayat` | Auth | Riwayat perubahan |
> | GET | `/api/pegawai/penerima-disposisi` | Admin | Daftar pegawai aktif |
>
>
> ### 📌 Fitur yang Sudah Selesai
>
> ✅ **Autentikasi**
> - Login dengan JWT
> - Role admin & pegawai
>
> ✅ **Surat Masuk**
> - Daftar surat masuk
> - Tambah surat masuk (upload file PDF)
> - Nomor agenda otomatis (format NNNN/TAHUN)
>
> ✅ **Disposisi**
> - Admin buat disposisi ke pegawai
> - Pegawai lihat disposisi yang diterima
> - Tandai sudah dibaca
> - Ubah status (belum_dibaca → diproses → selesai)
> - Riwayat perubahan status
> - Notifikasi in-app
>
> ✅ **Manajemen Pegawai**
> - Daftar pegawai dengan akun aktif
> - Filter pencarian (untuk dropdown penerima disposisi)
>
> ---
>
> ### ⏳ Fitur Selanjutnya (Menunggu Konfirmasi)
> - Notifikasi (GET /notifikasi, PATCH /notifikasi/baca-semua)
> - Surat Keluar (template, generate nomor, PDF)
>
> ---
>
> ### 📞 Kontak
> Jika ada kendala atau pertanyaan, tanyakan langsung ke saya (backend). Saya bantu.
>
> Selamat integrasi! 🚀

---

## 📌 Yang Perlu Ditambahkan Jika Perlu

Jika tim frontend minta file kontrak API, kasih tahu:

> *"Kontrak API ada di file `Kontrak_API_SI_Persuratan.md` yang sudah kita sepakati sebelumnya. Kalau hilang, saya kirim ulang."*

---

## ✅ Ringkasan yang Sudah Kita Buat

| Modul | Endpoint | Status |
|-------|----------|--------|
| Auth | Login | ✅ |
| Surat Masuk | GET daftar, POST tambah, GET detail | ✅ |
| Disposisi | POST buat, GET saya, GET detail, PATCH baca, PATCH status, GET riwayat | ✅ |
| Pegawai | GET penerima disposisi | ✅ |
| Database | Migrasi & seeder | ✅ |

