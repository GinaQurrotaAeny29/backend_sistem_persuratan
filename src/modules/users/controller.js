const db = require('../../config/db');
const bcrypt = require('bcrypt');

// ============================================
// Fungsi bantu: buang password_hash dari response
// ============================================
const serializeUser = (user) => {
  const { password_hash, ...rest } = user;
  return rest;
};

// ============================================
// GET /users — Daftar user
// Query: ?role=&q=&page=&limit=
// ============================================
const index = async (req, res) => {
  try {
    const { role, q = '', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('users')
      .leftJoin('pegawai', 'users.id', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .select(
        'users.id',
        'users.username',
        'users.nama',
        'users.role',
        'users.status',
        'users.terakhir_masuk',
        'users.created_at',
        'users.updated_at',
        'pegawai.id as pegawai_id',
        'pegawai.jabatan',
        'pegawai.bagian_id as pegawai_bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      );

    if (role) {
      query = query.where('users.role', role);
    }

    if (q) {
      query = query.where(function () {
        this.where('users.username', 'like', `%${q}%`)
          .orWhere('users.nama', 'like', `%${q}%`);
      });
    }

    const totalQuery = query.clone().clearSelect().count('users.id as total').first();
    const dataQuery = query.orderBy('users.nama', 'asc').limit(parseInt(limit)).offset(offset);

    const [totalResult, rawData] = await Promise.all([totalQuery, dataQuery]);

    const data = rawData.map((u) => ({
      id: u.id,
      nama: u.nama,
      username: u.username,
      role: u.role,
      jabatan: u.jabatan || null,
      bagian: u.bagian_kode
        ? { id: u.pegawai_bagian_id, kode: u.bagian_kode, nama: u.bagian_nama }
        : null,
      status: u.status,
      terakhir_masuk: u.terakhir_masuk
    }));

    return res.status(200).json({
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.total),
        total_page: Math.ceil(parseInt(totalResult.total) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error GET /users:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user'
    });
  }
};

// ============================================
// GET /users/:id — Detail user
// ============================================
const show = async (req, res) => {
  try {
    const user = await db('users')
      .leftJoin('pegawai', 'users.id', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .where('users.id', req.params.id)
      .select(
        'users.id',
        'users.username',
        'users.nama',
        'users.role',
        'users.status',
        'users.terakhir_masuk',
        'users.created_at',
        'users.updated_at',
        'pegawai.jabatan',
        'pegawai.bagian_id as pegawai_bagian_id',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        jabatan: user.jabatan || null,
        bagian: user.bagian_id
          ? { id: user.bagian_id, kode: user.bagian_kode, nama: user.bagian_nama }
          : null,
        status: user.status,
        terakhir_masuk: user.terakhir_masuk
      }
    });
  } catch (error) {
    console.error('Error GET /users/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail user'
    });
  }
};

// ============================================
// POST /users — Tambah user baru
// Body: { username, password_awal, nama, role }
// ============================================
const store = async (req, res) => {
  const { username, password_awal, nama, role } = req.body;

  // Validasi
  const errors = [];
  if (!username) errors.push({ field: 'username', message: 'Username wajib diisi' });
  if (!password_awal) errors.push({ field: 'password_awal', message: 'Password awal wajib diisi' });
  if (!nama) errors.push({ field: 'nama', message: 'Nama wajib diisi' });
  if (!role || !['admin', 'pegawai'].includes(role)) {
    errors.push({ field: 'role', message: 'Role harus "admin" atau "pegawai"' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
  }

  if (password_awal.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [{ field: 'password_awal', message: 'Password minimal 8 karakter' }]
    });
  }

  try {
    // Cek duplikasi username
    const existing = await db('users').where({ username }).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah digunakan'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password_awal, 10);

    const [id] = await db('users').insert({
      username,
      password_hash,
      nama,
      role,
      status: 'aktif'
    });

    const newUser = await db('users').where({ id }).first();

    return res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan',
      data: serializeUser(newUser)
    });
  } catch (error) {
    console.error('Error POST /users:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan user'
    });
  }
};

// ============================================
// PUT /users/:id — Ubah user
// Body: { username?, password_baru?, nama?, role? }
// Catatan: password_baru kosong = tidak diubah
// ============================================
const update = async (req, res) => {
  const id = req.params.id;
  const { username, password_baru, nama, role } = req.body;

  try {
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Cek duplikasi username jika diubah
    if (username && username !== user.username) {
      const existing = await db('users').where({ username }).whereNot({ id }).first();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }
    }

    // Validasi role jika diubah
    if (role && !['admin', 'pegawai'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus "admin" atau "pegawai"'
      });
    }

    // Bangun data update
    const updateData = {
      username: username || user.username,
      nama: nama || user.nama,
      role: role || user.role,
      updated_at: new Date()
    };

    // Password: hanya update jika diisi (layar 23)
    if (password_baru && password_baru.trim() !== '') {
      if (password_baru.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: [{ field: 'password_baru', message: 'Password minimal 8 karakter' }]
        });
      }
      updateData.password_hash = await bcrypt.hash(password_baru, 10);
    }

    await db('users').where({ id }).update(updateData);

    const updated = await db('users').where({ id }).first();

    return res.status(200).json({
      success: true,
      message: 'User berhasil diubah',
      data: serializeUser(updated)
    });
  } catch (error) {
    console.error('Error PUT /users/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah user'
    });
  }
};

// ============================================
// PATCH /users/:id/status — Aktif/nonaktif (K-16)
// ============================================
const ubahStatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!status || !['aktif', 'nonaktif'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status harus "aktif" atau "nonaktif"'
    });
  }

  try {
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await db('users').where({ id }).update({
      status,
      updated_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `User berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`
    });
  } catch (error) {
    console.error('Error PATCH /users/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status user'
    });
  }
};

// ============================================
// GET /users/tersedia — Akun yang belum dipakai pegawai lain
// Query: ?pegawai_id= (pegawai yang sedang disunting — aketnya dikecualikan agar selalu tampil)
// ============================================
const tersedia = async (req, res) => {
  try {
    const { pegawai_id } = req.query;

    // Ambil semua user_id yang sudah terpasang ke pegawai LAIN
    const terpakai = db('pegawai').whereNotNull('user_id').select('user_id');
    if (pegawai_id) {
      terpakai.whereNot({ id: pegawai_id });
    }

    const data = await db('users')
      .whereNotIn('users.id', terpakai)
      .where('users.status', 'aktif')
      .select('users.id', 'users.username', 'users.nama')
      .orderBy('users.username', 'asc');

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error GET /users/tersedia:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil akun tersedia'
    });
  }
};

module.exports = { index, show, store, update, ubahStatus, tersedia };