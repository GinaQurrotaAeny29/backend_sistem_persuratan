const db = require('../../config/db');

// ============================================
// GET /master/jenis-surat — Daftar jenis surat
// Query: ?q=&bagian_id=&page=&limit=
// ============================================
const index = async (req, res) => {
  try {
    const { q = '', bagian_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('jenis_surat')
      .leftJoin('bagian', 'jenis_surat.bagian_id', 'bagian.id')
      .select(
        'jenis_surat.*',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama',
        db.raw(`(
          SELECT COUNT(*) FROM template_surat
          WHERE template_surat.jenis_surat_id = jenis_surat.id
        ) as jumlah_template`)
      );

    // Filter pencarian
    if (q) {
      query = query.where(function () {
        this.where('jenis_surat.kode', 'like', `%${q}%`)
          .orWhere('jenis_surat.nama', 'like', `%${q}%`);
      });
    }

    // Filter bagian
    if (bagian_id) {
      query = query.where('jenis_surat.bagian_id', bagian_id);
    }

    // Hitung total dengan filter yang sama
    let totalQuery = db('jenis_surat').count('id as total');
    if (q) {
      totalQuery = totalQuery.where(function () {
        this.where('kode', 'like', `%${q}%`)
          .orWhere('nama', 'like', `%${q}%`);
      });
    }
    if (bagian_id) {
      totalQuery = totalQuery.where('bagian_id', bagian_id);
    }

    const dataQuery = query
      .orderBy('jenis_surat.kode', 'asc')
      .limit(parseInt(limit))
      .offset(offset);

    const [totalResult, rawData] = await Promise.all([totalQuery.first(), dataQuery]);

    // Format response dengan nested bagian + jumlah_template
    const data = rawData.map((j) => ({
      id: j.id,
      kode: j.kode,
      nama: j.nama,
      status: j.status,
      jumlah_template: parseInt(j.jumlah_template, 10) || 0,
      bagian: j.bagian_id
        ? { id: j.bagian_id, kode: j.bagian_kode, nama: j.bagian_nama }
        : null,
      created_at: j.created_at,
      updated_at: j.updated_at
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
    console.error('Error GET /master/jenis-surat:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jenis surat'
    });
  }
};

// ============================================
// GET /master/jenis-surat/:id
// ============================================
const show = async (req, res) => {
  try {
    const data = await db('jenis_surat')
      .leftJoin('bagian', 'jenis_surat.bagian_id', 'bagian.id')
      .where('jenis_surat.id', req.params.id)
      .select(
        'jenis_surat.*',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Jenis surat tidak ditemukan'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: data.id,
        kode: data.kode,
        nama: data.nama,
        status: data.status,
        bagian: data.bagian_id
          ? { id: data.bagian_id, kode: data.bagian_kode, nama: data.bagian_nama }
          : null
      }
    });
  } catch (error) {
    console.error('Error GET /master/jenis-surat/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail jenis surat'
    });
  }
};

// ============================================
// POST /master/jenis-surat
// ============================================
const store = async (req, res) => {
  const { kode, nama, bagian_id } = req.body;

  if (!kode || !nama) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: [
        !kode && { field: 'kode', message: 'Kode jenis surat wajib diisi' },
        !nama && { field: 'nama', message: 'Nama jenis surat wajib diisi' }
      ].filter(Boolean)
    });
  }

  try {
    const existing = await db('jenis_surat').where({ kode }).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Kode jenis surat sudah digunakan'
      });
    }

    const [id] = await db('jenis_surat').insert({
      kode: kode.toUpperCase(),
      nama,
      bagian_id: bagian_id || null,
      status: 'aktif'
    });

    const row = await db('jenis_surat')
      .leftJoin('bagian', 'jenis_surat.bagian_id', 'bagian.id')
      .where('jenis_surat.id', id)
      .select(
        'jenis_surat.id',
        'jenis_surat.kode',
        'jenis_surat.nama',
        'jenis_surat.status',
        'jenis_surat.bagian_id',
        'jenis_surat.created_at',
        'jenis_surat.updated_at',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    return res.status(201).json({
      success: true,
      message: 'Jenis surat berhasil ditambahkan',
      data: {
        id: row.id,
        kode: row.kode,
        nama: row.nama,
        status: row.status,
        jumlah_template: 0,
        bagian: row.bagian_id
          ? { id: row.bagian_id, kode: row.bagian_kode, nama: row.bagian_nama }
          : null,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error POST /master/jenis-surat:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan jenis surat'
    });
  }
};

// ============================================
// PUT /master/jenis-surat/:id
// ============================================
const update = async (req, res) => {
  const id = req.params.id;
  const { kode, nama, bagian_id } = req.body;

  try {
    const jenis = await db('jenis_surat').where({ id }).first();
    if (!jenis) {
      return res.status(404).json({
        success: false,
        message: 'Jenis surat tidak ditemukan'
      });
    }

    if (kode && kode.toUpperCase() !== jenis.kode) {
      const existing = await db('jenis_surat').where({ kode: kode.toUpperCase() }).first();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Kode jenis surat sudah digunakan'
        });
      }
    }

    await db('jenis_surat').where({ id }).update({
      kode: kode ? kode.toUpperCase() : jenis.kode,
      nama: nama || jenis.nama,
      bagian_id: bagian_id !== undefined ? bagian_id : jenis.bagian_id,
      updated_at: new Date()
    });

    const row = await db('jenis_surat')
      .leftJoin('bagian', 'jenis_surat.bagian_id', 'bagian.id')
      .where('jenis_surat.id', id)
      .select(
        'jenis_surat.id',
        'jenis_surat.kode',
        'jenis_surat.nama',
        'jenis_surat.status',
        'jenis_surat.bagian_id',
        'jenis_surat.created_at',
        'jenis_surat.updated_at',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();
    const jumlahTemplate = await db('template_surat')
      .where({ jenis_surat_id: id })
      .count('id as total')
      .first();

    return res.status(200).json({
      success: true,
      message: 'Jenis surat berhasil diubah',
      data: {
        id: row.id,
        kode: row.kode,
        nama: row.nama,
        status: row.status,
        jumlah_template: parseInt(jumlahTemplate.total, 10) || 0,
        bagian: row.bagian_id
          ? { id: row.bagian_id, kode: row.bagian_kode, nama: row.bagian_nama }
          : null,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error PUT /master/jenis-surat/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah jenis surat'
    });
  }
};

// ============================================
// PATCH /master/jenis-surat/:id/status
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
    const jenis = await db('jenis_surat').where({ id }).first();
    if (!jenis) {
      return res.status(404).json({
        success: false,
        message: 'Jenis surat tidak ditemukan'
      });
    }

    await db('jenis_surat').where({ id }).update({
      status,
      updated_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: `Jenis surat berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`
    });
  } catch (error) {
    console.error('Error PATCH /master/jenis-surat/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status jenis surat'
    });
  }
};

module.exports = { index, show, store, update, ubahStatus };