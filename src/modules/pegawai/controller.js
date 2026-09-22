const db = require('../../config/db');

// ============================================
// Fungsi bantu: ambil satu pegawai dalam bentuk nested
// (sama persis seperti shape index/show)
// ============================================
const ambilNested = async (id) => {
  const p = await db('pegawai')
    .leftJoin('users', 'pegawai.user_id', 'users.id')
    .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
    .where('pegawai.id', id)
    .select(
      'pegawai.id',
      'pegawai.nama',
      'pegawai.nip',
      'pegawai.jabatan',
      'pegawai.status',
      'users.id as user_id',
      'users.username',
      'bagian.id as bagian_id',
      'bagian.kode as bagian_kode',
      'bagian.nama as bagian_nama'
    )
    .first();

  if (!p) return null;
  return {
    id: p.id,
    nama: p.nama,
    nip: p.nip,
    jabatan: p.jabatan,
    status: p.status,
    bagian: p.bagian_id
      ? { id: p.bagian_id, kode: p.bagian_kode, nama: p.bagian_nama }
      : null,
    user: p.user_id
      ? { id: p.user_id, username: p.username }
      : null
  };
};

// ============================================
// GET /pegawai/penerima-disposisi — (lama, tetap dipertahankan)
// Hanya pegawai yang punya akun user aktif
// ============================================
const getPenerimaDisposisi = async (req, res) => {
  try {
    const { q = '' } = req.query;

    const query = db('pegawai')
      .join('users', 'pegawai.user_id', 'users.id')
      .where('users.status', 'aktif')
      .where('pegawai.status', 'aktif')
      .select(
        'pegawai.id',
        'pegawai.nama'
      )
      .orderBy('pegawai.nama');

    if (q) {
      query.where(function () {
        this.where('pegawai.nama', 'like', `%${q}%`)
          .orWhere('pegawai.nip', 'like', `%${q}%`)
          .orWhere('users.username', 'like', `%${q}%`);
      });
    }

    const rows = await query;
    const data = rows.map((p) => ({ id: p.id, nama: p.nama }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error GET /pegawai/penerima-disposisi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pegawai'
    });
  }
};

// ============================================
// GET /pegawai — Daftar semua pegawai
// Query: ?q=&bagian_id=&page=&limit=
// ============================================
const index = async (req, res) => {
  try {
    const { q = '', bagian_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('pegawai')
      .leftJoin('users', 'pegawai.user_id', 'users.id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .select(
        'pegawai.id',
        'pegawai.nama',
        'pegawai.nip',
        'pegawai.jabatan',
        'pegawai.status',
        'pegawai.created_at',
        'pegawai.updated_at',
        'users.id as user_id',
        'users.username',
        'users.status as user_status',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      );

    if (q) {
      query = query.where(function () {
        this.where('pegawai.nama', 'like', `%${q}%`)
          .orWhere('pegawai.nip', 'like', `%${q}%`)
          .orWhere('pegawai.jabatan', 'like', `%${q}%`);
      });
    }

    if (bagian_id) {
      query = query.where('pegawai.bagian_id', bagian_id);
    }

    const totalQuery = query.clone().clearSelect().count('pegawai.id as total').first();
    const dataQuery = query.orderBy('pegawai.nama', 'asc').limit(parseInt(limit)).offset(offset);

    const [totalResult, rawData] = await Promise.all([totalQuery, dataQuery]);

    const data = rawData.map((p) => ({
      id: p.id,
      nama: p.nama,
      nip: p.nip,
      jabatan: p.jabatan,
      status: p.status,
      bagian: p.bagian_id
        ? { id: p.bagian_id, kode: p.bagian_kode, nama: p.bagian_nama }
        : null,
      user: p.user_id
        ? { id: p.user_id, username: p.username, status: p.user_status }
        : null
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
    console.error('Error GET /pegawai:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pegawai'
    });
  }
};

// ============================================
// GET /pegawai/:id — Detail pegawai
// ============================================
const show = async (req, res) => {
  try {
    const pegawai = await db('pegawai')
      .leftJoin('users', 'pegawai.user_id', 'users.id')
      .leftJoin('bagian', 'pegawai.bagian_id', 'bagian.id')
      .where('pegawai.id', req.params.id)
      .select(
        'pegawai.*',
        'users.id as user_id',
        'users.username',
        'users.status as user_status',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    if (!pegawai) {
      return res.status(404).json({
        success: false,
        message: 'Pegawai tidak ditemukan'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: pegawai.id,
        nama: pegawai.nama,
        nip: pegawai.nip,
        jabatan: pegawai.jabatan,
        status: pegawai.status,
        bagian: pegawai.bagian_id
          ? { id: pegawai.bagian_id, kode: pegawai.bagian_kode, nama: pegawai.bagian_nama }
          : null,
        user: pegawai.user_id
          ? { id: pegawai.user_id, username: pegawai.username, status: pegawai.user_status }
          : null
      }
    });
  } catch (error) {
    console.error('Error GET /pegawai/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail pegawai'
    });
  }
};

// ============================================
// POST /pegawai — Tambah pegawai baru
// Body: { nama, nip, jabatan, bagian_id, user_id? }
// ============================================
const store = async (req, res) => {
  const { nama, nip, jabatan, bagian_id, user_id } = req.body;

  if (!nama) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [{ field: 'nama', message: 'Nama pegawai wajib diisi' }]
    });
  }

  try {
    // Jika user_id diberikan, cek apakah user ada dan belum terhubung pegawai lain
    if (user_id) {
      const user = await db('users').where({ id: user_id }).first();
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User dengan ID tersebut tidak ditemukan'
        });
      }

      const pegawaiExisting = await db('pegawai').where({ user_id }).first();
      if (pegawaiExisting) {
        return res.status(409).json({
          success: false,
          message: 'User sudah terhubung ke pegawai lain'
        });
      }
    }

    const [id] = await db('pegawai').insert({
      nama,
      nip: nip || null,
      jabatan: jabatan || null,
      bagian_id: bagian_id || null,
      user_id: user_id || null,
      status: 'aktif'
    });

    const nested = await ambilNested(id);

    return res.status(201).json({
      success: true,
      message: 'Pegawai berhasil ditambahkan',
      data: nested
    });
  } catch (error) {
    console.error('Error POST /pegawai:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan pegawai'
    });
  }
};

// ============================================
// PUT /pegawai/:id — Ubah pegawai
// ============================================
const update = async (req, res) => {
  const id = req.params.id;
  const { nama, nip, jabatan, bagian_id, user_id } = req.body;

  try {
    const pegawai = await db('pegawai').where({ id }).first();
    if (!pegawai) {
      return res.status(404).json({
        success: false,
        message: 'Pegawai tidak ditemukan'
      });
    }

    // Cek user_id jika diubah
    if (user_id !== undefined && user_id !== null && user_id !== pegawai.user_id) {
      const user = await db('users').where({ id: user_id }).first();
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User dengan ID tersebut tidak ditemukan'
        });
      }

      const pegawaiExisting = await db('pegawai').where({ user_id }).whereNot({ id }).first();
      if (pegawaiExisting) {
        return res.status(409).json({
          success: false,
          message: 'User sudah terhubung ke pegawai lain'
        });
      }
    }

    await db('pegawai').where({ id }).update({
      nama: nama || pegawai.nama,
      nip: nip !== undefined ? nip : pegawai.nip,
      jabatan: jabatan !== undefined ? jabatan : pegawai.jabatan,
      bagian_id: bagian_id !== undefined ? bagian_id : pegawai.bagian_id,
      user_id: user_id !== undefined ? user_id : pegawai.user_id,
      updated_at: new Date()
    });

    const updated = await ambilNested(id);

    return res.status(200).json({
      success: true,
      message: 'Pegawai berhasil diubah',
      data: updated
    });
  } catch (error) {
    console.error('Error PUT /pegawai/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah pegawai'
    });
  }
};

// ============================================
// PATCH /pegawai/:id/status — Aktif/nonaktif
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
    const pegawai = await db('pegawai').where({ id }).first();
    if (!pegawai) {
      return res.status(404).json({
        success: false,
        message: 'Pegawai tidak ditemukan'
      });
    }

    await db('pegawai').where({ id }).update({
      status,
      updated_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Pegawai berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`
    });
  } catch (error) {
    console.error('Error PATCH /pegawai/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status pegawai'
    });
  }
};

module.exports = {
  getPenerimaDisposisi,
  index,
  show,
  store,
  update,
  ubahStatus
};