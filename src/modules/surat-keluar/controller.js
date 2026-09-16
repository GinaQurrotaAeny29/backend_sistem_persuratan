const db = require('../../config/db');
const path = require('path');
const fs = require('fs');
const generateNomorSurat = require('../../utils/generateNomorSurat');
const { renderPDF } = require('../../utils/renderPDF');

// ============================================
// GET /surat-keluar — Daftar
// ============================================
const index = async (req, res) => {
  try {
    const { q = '', tahun, bagian_id, jenis_surat_id, jenis_input, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('surat_keluar')
      .leftJoin('bagian', 'surat_keluar.bagian_id', 'bagian.id')
      .leftJoin('jenis_surat', 'surat_keluar.jenis_surat_id', 'jenis_surat.id')
      .leftJoin('template_surat', 'surat_keluar.template_id', 'template_surat.id')
      .leftJoin('surat_masuk', 'surat_keluar.membalas_surat_masuk_id', 'surat_masuk.id')
      .select(
        'surat_keluar.id',
        'surat_keluar.nomor_surat',
        'surat_keluar.nomor_surat_manual',
        'surat_keluar.nomor_urut',
        'surat_keluar.tahun',
        'surat_keluar.jenis_input',
        'surat_keluar.tanggal_surat',
        'surat_keluar.kepada',
        'surat_keluar.perihal',
        'surat_keluar.pic',
        'surat_keluar.data_dinamis',
        'surat_keluar.membalas_surat_masuk_id',
        'surat_keluar.created_at',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama',
        'jenis_surat.id as jenis_id',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama',
        'template_surat.id as template_id',
        'template_surat.nama as template_nama',
        'surat_masuk.nomor_agenda as balasan_nomor_agenda',
        'surat_masuk.perihal as balasan_perihal'
      );

    if (q) {
      query = query.where(function () {
        this.where('surat_keluar.nomor_surat', 'like', `%${q}%`)
          .orWhere('surat_keluar.nomor_surat_manual', 'like', `%${q}%`)
          .orWhere('surat_keluar.perihal', 'like', `%${q}%`)
          .orWhere('surat_keluar.kepada', 'like', `%${q}%`);
      });
    }
    if (tahun) query = query.where('surat_keluar.tahun', tahun);
    if (bagian_id) query = query.where('surat_keluar.bagian_id', bagian_id);
    if (jenis_surat_id) query = query.where('surat_keluar.jenis_surat_id', jenis_surat_id);
    if (jenis_input) query = query.where('surat_keluar.jenis_input', jenis_input);

    const totalQuery = query.clone().clearSelect().count('surat_keluar.id as total').first();
    const dataQuery = query.orderBy('surat_keluar.created_at', 'desc').limit(parseInt(limit)).offset(offset);

    const [totalResult, rawData] = await Promise.all([totalQuery, dataQuery]);

    const data = rawData.map((s) => ({
      id: s.id,
      nomor_urut: s.nomor_urut,
      nomor_surat: s.nomor_surat,
      nomor_surat_manual: s.nomor_surat_manual,
      jenis_input: s.jenis_input,
      tahun: s.tahun,
      tanggal_surat: s.tanggal_surat,
      kepada: s.kepada,
      perihal: s.perihal,
      pic: s.pic,
      bagian: s.bagian_id ? { id: s.bagian_id, kode: s.bagian_kode, nama: s.bagian_nama } : null,
      jenis_surat: s.jenis_id ? { id: s.jenis_id, kode: s.jenis_kode, nama: s.jenis_nama } : null,
      template: s.template_id ? { id: s.template_id, nama: s.template_nama } : null,
      membalas_surat_masuk: s.membalas_surat_masuk_id ? {
        id: s.membalas_surat_masuk_id,
        nomor_agenda: s.balasan_nomor_agenda,
        perihal: s.balasan_perihal
      } : null,
      data_dinamis: s.data_dinamis ? (typeof s.data_dinamis === 'string' ? JSON.parse(s.data_dinamis) : s.data_dinamis) : {},
      dibuat_pada: s.created_at
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
    console.error('Error GET /surat-keluar:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data surat keluar' });
  }
};

// ============================================
// GET /surat-keluar/:id — Detail
// ============================================
const show = async (req, res) => {
  try {
    const s = await db('surat_keluar')
      .leftJoin('bagian', 'surat_keluar.bagian_id', 'bagian.id')
      .leftJoin('jenis_surat', 'surat_keluar.jenis_surat_id', 'jenis_surat.id')
      .leftJoin('template_surat', 'surat_keluar.template_id', 'template_surat.id')
      .leftJoin('surat_masuk', 'surat_keluar.membalas_surat_masuk_id', 'surat_masuk.id')
      .where('surat_keluar.id', req.params.id)
      .select(
        'surat_keluar.*',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama',
        'template_surat.nama as template_nama',
        'surat_masuk.nomor_agenda as balasan_nomor_agenda',
        'surat_masuk.perihal as balasan_perihal'
      )
      .first();

    if (!s) {
      return res.status(404).json({ success: false, message: 'Surat keluar tidak ditemukan' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: s.id,
        nomor_urut: s.nomor_urut,
        nomor_surat: s.nomor_surat,
        nomor_surat_manual: s.nomor_surat_manual,
        jenis_input: s.jenis_input,
        tahun: s.tahun,
        tanggal_surat: s.tanggal_surat,
        kepada: s.kepada,
        perihal: s.perihal,
        pic: s.pic,
        keterangan: s.keterangan,
        bagian: s.bagian_id ? { id: s.bagian_id, kode: s.bagian_kode, nama: s.bagian_nama } : null,
        jenis_surat: s.jenis_surat_id ? { id: s.jenis_surat_id, kode: s.jenis_kode, nama: s.jenis_nama } : null,
        template: s.template_id ? { id: s.template_id, nama: s.template_nama } : null,
        membalas_surat_masuk: s.membalas_surat_masuk_id ? {
          id: s.membalas_surat_masuk_id,
          nomor_agenda: s.balasan_nomor_agenda,
          perihal: s.balasan_perihal
        } : null,
        data_dinamis: s.data_dinamis ? (typeof s.data_dinamis === 'string' ? JSON.parse(s.data_dinamis) : s.data_dinamis) : {},
        dibuat_pada: s.created_at
      }
    });
  } catch (error) {
    console.error('Error GET /surat-keluar/:id:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail surat keluar' });
  }
};

// ============================================
// POST /surat-keluar — Buat surat keluar
// Body:
//   - jenis_input: 'baru' | 'lama' (default: 'baru')
//   - kalau 'baru': nomor di-generate otomatis
//   - kalau 'lama': wajib isi nomor_surat_manual, counter TIDAK dinaikkan
// ============================================
const store = async (req, res) => {
  const {
    jenis_input = 'baru',
    nomor_surat_manual,
    template_id,
    tanggal_surat,
    kepada,
    perihal,
    pic,
    keterangan,
    data_dinamis
  } = req.body;

  // Validasi dasar
  const errors = [];
  if (!['baru', 'lama'].includes(jenis_input)) {
    errors.push({ field: 'jenis_input', message: 'Jenis input harus "baru" atau "lama"' });
  }
  if (jenis_input === 'lama' && !nomor_surat_manual) {
    errors.push({ field: 'nomor_surat_manual', message: 'Nomor surat manual wajib diisi untuk surat lama' });
  }
  if (!template_id) errors.push({ field: 'template_id', message: 'Template wajib dipilih' });
  if (!tanggal_surat) errors.push({ field: 'tanggal_surat', message: 'Tanggal surat wajib diisi' });
  if (!kepada) errors.push({ field: 'kepada', message: 'Kepada wajib diisi' });
  if (!perihal) errors.push({ field: 'perihal', message: 'Perihal wajib diisi' });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
  }

  try {
    // Ambil template + jenis surat + bagian
    const template = await db('template_surat')
      .leftJoin('jenis_surat', 'template_surat.jenis_surat_id', 'jenis_surat.id')
      .leftJoin('bagian', 'jenis_surat.bagian_id', 'bagian.id')
      .where('template_surat.id', template_id)
      .select(
        'template_surat.*',
        'jenis_surat.id as jenis_id',
        'jenis_surat.kode as jenis_kode',
        'jenis_surat.nama as jenis_nama',
        'bagian.id as bagian_id',
        'bagian.kode as bagian_kode',
        'bagian.nama as bagian_nama'
      )
      .first();

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template tidak ditemukan' });
    }

    if (!template.is_active) {
      return res.status(400).json({ success: false, message: 'Template sedang nonaktif' });
    }

    // Dapatkan pegawai dari admin yang login
    const adminPegawai = await db('pegawai').where({ user_id: req.user.id }).first();
    if (!adminPegawai) {
      return res.status(403).json({ success: false, message: 'Admin tidak memiliki data pegawai' });
    }

    // ============================================
    // PERCABANGAN: Surat Baru vs Surat Lama
    // ============================================
    let result;

    if (jenis_input === 'lama') {
      // ===== SURAT LAMA =====
      // Cek duplikasi nomor manual
      const duplikat = await db('surat_keluar')
        .where({ nomor_surat_manual })
        .first();

      if (duplikat) {
        return res.status(409).json({
          success: false,
          message: 'Nomor surat manual sudah digunakan'
        });
      }

      // Simpan tanpa menyentuh counter
      const [id] = await db('surat_keluar').insert({
        nomor_urut: null, // Surat lama tidak punya nomor urut dari counter
        tahun: new Date(tanggal_surat).getFullYear(),
        nomor_surat: nomor_surat_manual, // Pakai nomor manual
        nomor_surat_manual,
        jenis_input: 'lama',
        tanggal_surat,
        kepada,
        perihal,
        pic: pic || null,
        keterangan: keterangan || null,
        bagian_id: template.bagian_id,
        jenis_surat_id: template.jenis_id,
        template_id: template.id,
        data_dinamis: data_dinamis ? JSON.stringify(data_dinamis) : null,
        dibuat_oleh: req.user.id
      });

      result = { id, nomorSurat: nomor_surat_manual };

    } else {
      // ===== SURAT BARU =====
      // Generate nomor otomatis (dalam transaksi)
      result = await db.transaction(async (trx) => {
        const { nomorSurat, nomorUrut, tahun } = await generateNomorSurat(
          trx,
          tanggal_surat,
          {
            kode: template.jenis_kode,
            bagian_kode: template.bagian_kode
          }
        );

        const [id] = await trx('surat_keluar').insert({
          nomor_urut: nomorUrut,
          tahun,
          nomor_surat: nomorSurat,
          nomor_surat_manual: null,
          jenis_input: 'baru',
          tanggal_surat,
          kepada,
          perihal,
          pic: pic || null,
          keterangan: keterangan || null,
          bagian_id: template.bagian_id,
          jenis_surat_id: template.jenis_id,
          template_id: template.id,
          data_dinamis: data_dinamis ? JSON.stringify(data_dinamis) : null,
          dibuat_oleh: req.user.id
        });

        return { id, nomorSurat };
      });
    }

    // ============================================
    // RENDER PDF (untuk kedua jenis)
    // ============================================
    try {
      const namaFile = `${result.id}-${result.nomorSurat.replace(/[\/\\]/g, '-')}.pdf`;
      const filePath = await renderPDF(template.konten_html, data_dinamis || {}, namaFile);

      await db('surat_keluar').where({ id: result.id }).update({ file_path: filePath });
    } catch (pdfError) {
      console.warn('⚠️ PDF gagal dibuat, surat tetap tersimpan:', pdfError.message);
    }

    // Ambil data lengkap untuk response
    const newData = await db('surat_keluar').where({ id: result.id }).first();

    return res.status(201).json({
      success: true,
      message: jenis_input === 'lama'
        ? 'Surat lama berhasil disimpan'
        : 'Surat keluar berhasil dibuat',
      data: {
        id: newData.id,
        jenis_input: newData.jenis_input,
        nomor_urut: newData.nomor_urut,
        nomor_surat: newData.nomor_surat,
        nomor_surat_manual: newData.nomor_surat_manual,
        tahun: newData.tahun,
        tanggal_surat: newData.tanggal_surat,
        kepada: newData.kepada,
        perihal: newData.perihal,
        pic: newData.pic,
        keterangan: newData.keterangan,
        data_dinamis: data_dinamis || {},
        dibuat_pada: newData.created_at
      }
    });

  } catch (error) {
    console.error('Error POST /surat-keluar:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat surat keluar: ' + error.message
    });
  }
};

// ============================================
// GET /surat-keluar/:id/file — Download PDF
// ============================================
const downloadFile = async (req, res) => {
  try {
    const surat = await db('surat_keluar').where({ id: req.params.id }).first();

    if (!surat) {
      return res.status(404).json({ success: false, message: 'Surat keluar tidak ditemukan' });
    }

    if (!surat.file_path || !fs.existsSync(surat.file_path)) {
      return res.status(404).json({ success: false, message: 'Berkas PDF belum tersedia' });
    }

    const namaFile = `${surat.nomor_surat.replace(/[\/\\]/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${namaFile}"`);
    return res.sendFile(path.resolve(surat.file_path));
  } catch (error) {
    console.error('Error GET /surat-keluar/:id/file:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengunduh berkas' });
  }
};

// ============================================
// GET /surat-keluar/tersedia — Untuk dropdown balasan
// ============================================
const tersedia = async (req, res) => {
  try {
    const { q = '' } = req.query;

    let query = db('surat_keluar')
      .whereNull('membalas_surat_masuk_id')
      .select('id', 'nomor_surat', 'nomor_surat_manual', 'jenis_input', 'perihal', 'tanggal_surat')
      .orderBy('created_at', 'desc')
      .limit(50);

    if (q) {
      query = query.where(function () {
        this.where('nomor_surat', 'like', `%${q}%`)
          .orWhere('nomor_surat_manual', 'like', `%${q}%`)
          .orWhere('perihal', 'like', `%${q}%`);
      });
    }

    const data = await query;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error GET /surat-keluar/tersedia:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data surat keluar tersedia' });
  }
};

module.exports = { index, show, store, downloadFile, tersedia };