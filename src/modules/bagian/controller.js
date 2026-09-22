const db = require('../../config/db');

// ============================================
// GET /master/bagian — Daftar semua bagian
// Query: ?q=&page=&limit=
// ============================================
const index = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const tahunBerjalan = new Date().getFullYear();

    // Query dasar + subquery hitungan
    let query = db('bagian').select(
      'bagian.*',
      db.raw(`(
        SELECT COUNT(*) FROM jenis_surat
        WHERE jenis_surat.bagian_id = bagian.id
      ) as jumlah_kode_surat`),
      db.raw(`(
        SELECT COUNT(*) FROM surat_keluar
        WHERE surat_keluar.bagian_id = bagian.id
          AND surat_keluar.tahun = ?
      ) as jumlah_surat_tahun_ini`, [tahunBerjalan])
    );

    // Filter pencarian (kode atau nama)
    if (q) {
      query = query.where(function () {
        this.where('bagian.kode', 'like', `%${q}%`)
          .orWhere('bagian.nama', 'like', `%${q}%`);
      });
    }

    // Hitung total (untuk pagination)
    let totalQuery = db('bagian').count('id as total');
    if (q) {
      totalQuery = totalQuery.where(function () {
        this.where('kode', 'like', `%${q}%`)
          .orWhere('nama', 'like', `%${q}%`);
      });
    }

    const dataQuery = query
      .orderBy('bagian.urutan_tampil', 'asc')
      .orderBy('bagian.nama', 'asc')
      .limit(parseInt(limit))
      .offset(offset);

    const [totalResult, rawData] = await Promise.all([totalQuery.first(), dataQuery]);

    // Format: pastikan hitungan jadi integer
    const data = rawData.map((b) => ({
      ...b,
      jumlah_kode_surat: parseInt(b.jumlah_kode_surat, 10) || 0,
      jumlah_surat_tahun_ini: parseInt(b.jumlah_surat_tahun_ini, 10) || 0
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
    console.error('Error GET /master/bagian:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data bagian'
    });
  }
};

// ============================================
// GET /master/bagian/:id — Detail bagian
// ============================================
const show = async (req, res) => {
  try {
    const bagian = await db('bagian').where({ id: req.params.id }).first();
    if (!bagian) {
      return res.status(404).json({
        success: false,
        message: 'Bagian tidak ditemukan'
      });
    }
    return res.status(200).json({ success: true, data: bagian });
  } catch (error) {
    console.error('Error GET /master/bagian/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail bagian'
    });
  }
};

// ============================================
// POST /master/bagian — Tambah bagian baru
// ============================================
const store = async (req, res) => {
  const { kode, nama, urutan_tampil } = req.body;

  if (!kode || !nama) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [
        !kode && { field: 'kode', message: 'Kode bagian wajib diisi' },
        !nama && { field: 'nama', message: 'Nama bagian wajib diisi' }
      ].filter(Boolean)
    });
  }

  try {
    const existing = await db('bagian').where({ kode }).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Kode bagian sudah digunakan'
      });
    }

    const [id] = await db('bagian').insert({
      kode: kode.toUpperCase(),
      nama,
      urutan_tampil: urutan_tampil || 0,
      status: 'aktif'
    });

    const newData = await db('bagian').where({ id }).first();
    const tahunBerjalan = new Date().getFullYear();
    const jumlahKode = await db('jenis_surat').where({ bagian_id: id }).count('id as total').first();
    const jumlahSurat = await db('surat_keluar')
      .where({ bagian_id: id, tahun: tahunBerjalan })
      .count('id as total')
      .first();

    return res.status(201).json({
      success: true,
      message: 'Bagian berhasil ditambahkan',
      data: {
        ...newData,
        jumlah_kode_surat: parseInt(jumlahKode.total, 10) || 0,
        jumlah_surat_tahun_ini: parseInt(jumlahSurat.total, 10) || 0
      }
    });
  } catch (error) {
    console.error('Error POST /master/bagian:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan bagian'
    });
  }
};

// ============================================
// PUT /master/bagian/:id — Ubah bagian
// ============================================
const update = async (req, res) => {
  const id = req.params.id;
  const { kode, nama, urutan_tampil } = req.body;

  try {
    const bagian = await db('bagian').where({ id }).first();
    if (!bagian) {
      return res.status(404).json({
        success: false,
        message: 'Bagian tidak ditemukan'
      });
    }

    if (kode && kode.toUpperCase() !== bagian.kode) {
      const existing = await db('bagian').where({ kode: kode.toUpperCase() }).first();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Kode bagian sudah digunakan'
        });
      }
    }

    await db('bagian').where({ id }).update({
      kode: kode ? kode.toUpperCase() : bagian.kode,
      nama: nama || bagian.nama,
      urutan_tampil: urutan_tampil !== undefined ? urutan_tampil : bagian.urutan_tampil,
      updated_at: new Date()
    });

    const updated = await db('bagian').where({ id }).first();
    const tahunBerjalan = new Date().getFullYear();
    const jumlahKode = await db('jenis_surat').where({ bagian_id: id }).count('id as total').first();
    const jumlahSurat = await db('surat_keluar')
      .where({ bagian_id: id, tahun: tahunBerjalan })
      .count('id as total')
      .first();

    return res.status(200).json({
      success: true,
      message: 'Bagian berhasil diubah',
      data: {
        ...updated,
        jumlah_kode_surat: parseInt(jumlahKode.total, 10) || 0,
        jumlah_surat_tahun_ini: parseInt(jumlahSurat.total, 10) || 0
      }
    });
  } catch (error) {
    console.error('Error PUT /master/bagian/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah bagian'
    });
  }
};

// ============================================
// PATCH /master/bagian/:id/status — Aktif/nonaktif
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
    const bagian = await db('bagian').where({ id }).first();
    if (!bagian) {
      return res.status(404).json({
        success: false,
        message: 'Bagian tidak ditemukan'
      });
    }

    await db('bagian').where({ id }).update({
      status,
      updated_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Bagian berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`
    });
  } catch (error) {
    console.error('Error PATCH /master/bagian/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status bagian'
    });
  }
};

module.exports = { index, show, store, update, ubahStatus };