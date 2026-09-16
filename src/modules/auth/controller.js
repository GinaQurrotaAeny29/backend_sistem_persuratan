const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ============================================
// POST /auth/login
// ============================================
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [
        { field: 'username', message: 'Username wajib diisi' },
        { field: 'password', message: 'Password wajib diisi' }
      ]
    });
  }

  try {
    const userData = await db('users')
      .leftJoin('pegawai', 'users.id', '=', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', '=', 'bagian.id')
      .where('users.username', username)
      .select(
        'users.id as user_id',
        'users.username',
        'users.password_hash',
        'users.role',
        'users.nama as user_nama',
        'users.status',
        'users.terakhir_masuk',
        'pegawai.id as pegawai_id',
        'pegawai.nama as pegawai_nama',
        'pegawai.jabatan',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Nama pengguna atau kata sandi tidak sesuai'
      });
    }

    if (userData.status === 'nonaktif') {
      return res.status(403).json({
        success: false,
        message: 'Akun dinonaktifkan. Hubungi admin.'
      });
    }

    const isMatch = await bcrypt.compare(password, userData.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nama pengguna atau kata sandi tidak sesuai'
      });
    }

    await db('users')
      .where({ id: userData.user_id })
      .update({ terakhir_masuk: new Date() });

    const token = jwt.sign(
      {
        id: userData.user_id,
        role: userData.role,
        pegawai_id: userData.pegawai_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    const userResponse = {
      id: userData.user_id,
      nama: userData.pegawai_nama || userData.user_nama,
      username: userData.username,
      role: userData.role,
      jabatan: userData.jabatan,
      bagian: userData.bagian_id ? {
        id: userData.bagian_id,
        kode: userData.bagian_kode,
        nama: userData.bagian_nama
      } : null,
      status: userData.status,
      terakhir_masuk: userData.terakhir_masuk
    };

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// ============================================
// GET /auth/me — Ambil profil user yang sedang login
// ============================================
const me = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await db('users')
      .leftJoin('pegawai', 'users.id', '=', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', '=', 'bagian.id')
      .where('users.id', userId)
      .select(
        'users.id as user_id',
        'users.username',
        'users.role',
        'users.nama as user_nama',
        'users.status',
        'users.terakhir_masuk',
        'pegawai.id as pegawai_id',
        'pegawai.nama as pegawai_nama',
        'pegawai.jabatan',
        'pegawai.nip',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const userResponse = {
      id: userData.user_id,
      nama: userData.pegawai_nama || userData.user_nama,
      username: userData.username,
      role: userData.role,
      jabatan: userData.jabatan,
      nip: userData.nip,
      bagian: userData.bagian_id ? {
        id: userData.bagian_id,
        kode: userData.bagian_kode,
        nama: userData.bagian_nama
      } : null,
      status: userData.status,
      terakhir_masuk: userData.terakhir_masuk
    };

    return res.status(200).json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Error GET /auth/me:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil'
    });
  }
};

// ============================================
// PATCH /auth/password — Ganti kata sandi
// ============================================
const ubahPassword = async (req, res) => {
  const userId = req.user.id;
  const { password_lama, password_baru } = req.body;

  // Validasi
  if (!password_lama || !password_baru) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [
        !password_lama && { field: 'password_lama', message: 'Password lama wajib diisi' },
        !password_baru && { field: 'password_baru', message: 'Password baru wajib diisi' }
      ].filter(Boolean)
    });
  }

  if (password_baru.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [
        { field: 'password_baru', message: 'Password baru minimal 8 karakter' }
      ]
    });
  }

  try {
    // Cek user
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(password_lama, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai'
      });
    }

    // Hash password baru
    const newHash = await bcrypt.hash(password_baru, 10);

    // Update
    await db('users')
      .where({ id: userId })
      .update({
        password_hash: newHash,
        updated_at: new Date()
      });

    return res.status(200).json({
      success: true,
      message: 'Kata sandi berhasil diubah. Anda tetap masuk.'
    });

  } catch (error) {
    console.error('Error PATCH /auth/password:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah kata sandi'
    });
  }
};

// ============================================
// POST /auth/logout — Logout (opsional)
// ============================================
const logout = async (req, res) => {
  // Karena JWT stateless, logout cukup di sisi frontend (hapus token).
  // Endpoint ini hanya sebagai formalitas untuk memenuhi kontrak.
  return res.status(200).json({
    success: true,
    message: 'Berhasil keluar. Silakan hapus token di sisi klien.'
  });
};

module.exports = {
  login,
  me,
  ubahPassword,
  logout
};