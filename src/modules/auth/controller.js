const db = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;

  // Validasi input
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
    // Cari user + join ke pegawai dan bagian
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

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, userData.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nama pengguna atau kata sandi tidak sesuai'
      });
    }

    // Update terakhir_masuk
    await db('users')
      .where({ id: userData.user_id })
      .update({ terakhir_masuk: new Date() });

    // Buat JWT token
    const token = jwt.sign(
      {
        id: userData.user_id,
        role: userData.role,
        pegawai_id: userData.pegawai_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    // Bentuk response user sesuai kontrak
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

module.exports = { login };