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
// Body: { username, password_awal, nama, role, jabatan?, bagian_id?, status? }
// jabatan & bagian_id disimpan di tabel pegawai (baru dibuat jika ada isian)
// ============================================
const store = async (req, res) => {
  const { username, password_awal, nama, role, jabatan, bagian_id, status: statusBaru } = req.body;

  // Validasi
  const errors = [];
  if (!username) errors.push({ field: 'username', message: 'Username wajib diisi' });
  if (!password_awal) errors.push({ field: 'password_awal', message: 'Password awal wajib diisi' });
  if (!nama) errors.push({ field: 'nama', message: 'Nama wajib diisi' });
  if (!role || !['admin', 'pegawai'].includes(role)) {
    errors.push({ field: 'role', message: 'Role harus "admin" atau "pegawai"' });
  }
  if (statusBaru && !['aktif', 'nonaktif'].includes(statusBaru)) {
    errors.push({ field: 'status', message: 'Status harus "aktif" atau "nonaktif"' });
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

  if (bagian_id !== undefined && bagian_id !== null) {
    const bagian = await db('bagian').where({ id: bagian_id }).first();
    if (!bagian) {
      return res.status(400).json({ success: false, message: 'Bagian tidak ditemukan' });
    }
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
      status: statusBaru || 'aktif'
    });

    // Buat baris pegawai jika ada jabatan / bagian diisi —
    // tanpa ini, PUT berikutnya tidak punya baris pegawai untuk diperbarui.
    if (jabatan || bagian_id) {
      await db('pegawai').insert({
        nama,
        jabatan: jabatan || null,
        bagian_id: bagian_id || null,
        user_id: id,
        status: 'aktif'
      });
    }

    const newUser = await db('users')
      .leftJoin('pegawai', 'users.id', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .where('users.id', id)
      .select(
        'users.id',
        'users.username',
        'users.nama',
        'users.role',
        'users.status',
        'users.terakhir_masuk',
        'pegawai.jabatan',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    return res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan',
      data: {
        id: newUser.id,
        nama: newUser.nama,
        username: newUser.username,
        role: newUser.role,
        jabatan: newUser.jabatan || null,
        bagian: newUser.bagian_id
          ? { id: newUser.bagian_id, kode: newUser.bagian_kode, nama: newUser.bagian_nama }
          : null,
        status: newUser.status,
        terakhir_masuk: newUser.terakhir_masuk
      }
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
// Body: { username?, password_baru|password_awal?, nama?, role?, jabatan?, bagian_id?, status? }
// jabatan & bagian_id disimpan di tabel pegawai (jika ada), status di users
// ============================================
const update = async (req, res) => {
  const id = req.params.id;
  const {
    username,
    password_baru,
    password_awal,
    nama,
    role,
    jabatan,
    bagian_id,
    status: statusBaru,
  } = req.body;

  try {
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (parseInt(id, 10) === req.user.id) {
      if (statusBaru === 'nonaktif') {
        return res.status(409).json({
          success: false,
          message: 'Anda tidak dapat menonaktifkan akun Anda sendiri'
        });
      }
      if (role && role !== user.role) {
        return res.status(409).json({
          success: false,
          message: 'Anda tidak dapat mengubah role akun Anda sendiri'
        });
      }
    }

    if (username && username !== user.username) {
      const existing = await db('users').where({ username }).whereNot({ id }).first();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }
    }

    if (role && !['admin', 'pegawai'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role harus "admin" atau "pegawai"'
      });
    }

    if (statusBaru && !['aktif', 'nonaktif'].includes(statusBaru)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus "aktif" atau "nonaktif"'
      });
    }

    if (bagian_id !== undefined && bagian_id !== null) {
      const bagian = await db('bagian').where({ id: bagian_id }).first();
      if (!bagian) {
        return res.status(400).json({
          success: false,
          message: 'Bagian tidak ditemukan'
        });
      }
    }

    const updateData = {
      username: username || user.username,
      nama: nama || user.nama,
      role: role || user.role,
      updated_at: new Date()
    };
    if (statusBaru) updateData.status = statusBaru;

    const pw = password_baru || password_awal;
    if (pw && pw.trim() !== '') {
      if (pw.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: [{ field: 'password_awal', message: 'Password minimal 8 karakter' }]
        });
      }
      updateData.password_hash = await bcrypt.hash(pw, 10);
    }

    await db('users').where({ id }).update(updateData);

    const pegawai = await db('pegawai').where({ user_id: id }).first();
    if (pegawai) {
      const pgUpdate = { updated_at: new Date() };
      if (jabatan !== undefined) pgUpdate.jabatan = jabatan || null;
      if (bagian_id !== undefined) pgUpdate.bagian_id = bagian_id;
      await db('pegawai').where({ id: pegawai.id }).update(pgUpdate);
    }

    const updated = await db('users')
      .leftJoin('pegawai', 'users.id', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .where('users.id', id)
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

    return res.status(200).json({
      success: true,
      message: 'User berhasil diubah',
      data: {
        id: updated.id,
        nama: updated.nama,
        username: updated.username,
        role: updated.role,
        jabatan: updated.jabatan || null,
        bagian: updated.bagian_id
          ? { id: updated.bagian_id, kode: updated.bagian_kode, nama: updated.bagian_nama }
          : null,
        status: updated.status,
        terakhir_masuk: updated.terakhir_masuk
      }
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

    const updated = await db('users')
      .leftJoin('pegawai', 'users.id', 'pegawai.user_id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .where('users.id', id)
      .select(
        'users.id',
        'users.username',
        'users.nama',
        'users.role',
        'users.status',
        'users.terakhir_masuk',
        'pegawai.jabatan',
        'pegawai.bagian_id as pegawai_bagian_id',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    return res.status(200).json({
      success: true,
      message: `User berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`,
      data: {
        id: updated.id,
        nama: updated.nama,
        username: updated.username,
        role: updated.role,
        jabatan: updated.jabatan || null,
        bagian: updated.bagian_id
          ? { id: updated.bagian_id, kode: updated.bagian_kode, nama: updated.bagian_nama }
          : null,
        status: updated.status,
        terakhir_masuk: updated.terakhir_masuk
      }
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