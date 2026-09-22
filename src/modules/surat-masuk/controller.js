const db = require('../../config/db');
const path = require('path');
const fs = require('fs');
const generateNomorAgenda = require('../../utils/generateAgenda');

// ============================================
// GET /surat-masuk (daftar)
// ============================================
const index = async (req, res) => {
  try {
    const { q = '', status, tanggal_dari, tanggal_sampai, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db('surat_masuk')
      .leftJoin('users as pembuat', 'surat_masuk.dibuat_oleh', 'pembuat.id')
      .select('surat_masuk.*', 'pembuat.nama as pembuat_nama');

    if (q) {
      query = query.where(function () {
        this.where('surat_masuk.nomor_surat', 'like', `%${q}%`)
          .orWhere('surat_masuk.perihal', 'like', `%${q}%`)
          .orWhere('surat_masuk.pengirim', 'like', `%${q}%`);
      });
    }
    if (tanggal_dari) query = query.where('surat_masuk.tanggal_surat', '>=', tanggal_dari);
    if (tanggal_sampai) query = query.where('surat_masuk.tanggal_surat', '<=', tanggal_sampai);

    query = query.orderBy('surat_masuk.created_at', 'desc');
    const rawSurat = await query;

    const ids = rawSurat.map(s => s.id);
    const disposisiMap = {};
    if (ids.length > 0) {
      const disposisiList = await db('disposisi')
        .whereIn('surat_masuk_id', ids)
        .select('disposisi.surat_masuk_id', 'disposisi.status', 'disposisi.batas_waktu')
        .orderBy('disposisi.created_at', 'asc');
      for (const d of disposisiList) {
        if (!disposisiMap[d.surat_masuk_id]) disposisiMap[d.surat_masuk_id] = { statuses: [], disposisi: [] };
        disposisiMap[d.surat_masuk_id].statuses.push(d.status);
        disposisiMap[d.surat_masuk_id].disposisi.push(d);
      }
    }

    const semuaSurat = rawSurat.map(s => {
      const md = disposisiMap[s.id] || { statuses: [], disposisi: [] };
      let statusDisposisi = null;
      if (md.statuses.length > 0) {
        if (md.statuses.every(x => x === 'selesai')) statusDisposisi = 'selesai';
        else if (md.statuses.some(x => x === 'belum_dibaca')) statusDisposisi = 'belum_dibaca';
        else statusDisposisi = 'diproses';
      }
      const today = new Date();
      const terlambat = md.disposisi.some(d => d.batas_waktu && new Date(d.batas_waktu) < today && d.status !== 'selesai');
      return { surat: s, statusDisposisi, terlambat };
    });

    const difilter = status ? semuaSurat.filter(s => {
      if (status === 'belum_didisposisi') return s.statusDisposisi === null;
      return s.statusDisposisi === status;
    }) : semuaSurat;

    const total = difilter.length;
    const data = difilter.slice(offset, offset + parseInt(limit)).map(({ surat, statusDisposisi, terlambat }) => ({
      id: surat.id,
      nomor_agenda: surat.nomor_agenda,
      nomor_surat: surat.nomor_surat,
      tanggal_surat: surat.tanggal_surat,
      perihal: surat.perihal,
      pengirim: surat.pengirim,
      pic: surat.pic,
      keterangan: surat.keterangan,
      status_disposisi: statusDisposisi,
      terlambat,
      berkas: surat.file_name ? { nama: surat.file_name, ukuran: surat.file_size } : null,
      dibuat_oleh: { id: surat.dibuat_oleh, nama: surat.pembuat_nama },
      dibuat_pada: surat.created_at
    }));

    return res.status(200).json({
      success: true,
      data,
      meta: { page: parseInt(page), limit: parseInt(limit), total, total_page: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Error GET /surat-masuk:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data surat masuk' });
  }
};

// ============================================
// GET /surat-masuk/:id (detail)
// ============================================
const show = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Ambil surat masuk
    const surat = await db('surat_masuk')
      .where('surat_masuk.id', id)
      .join('users as pembuat', 'surat_masuk.dibuat_oleh', 'pembuat.id')
      .select(
        'surat_masuk.*',
        'pembuat.nama as pembuat_nama'
      )
      .first();

    if (!surat) {
      return res.status(404).json({
        success: false,
        message: 'Surat masuk tidak ditemukan'
      });
    }

    // Ambil disposisi untuk surat ini
    const disposisiList = await db('disposisi')
      .where('disposisi.surat_masuk_id', id)
      .join('pegawai as penerima', 'disposisi.kepada_pegawai_id', 'penerima.id')
      .select(
        'disposisi.id',
        'disposisi.instruksi',
        'disposisi.batas_waktu',
        'disposisi.status',
        'penerima.id as penerima_id',
        'penerima.nama as penerima_nama'
      )
      .orderBy('disposisi.created_at', 'asc');

    // Hitung status_disposisi
    let statusDisposisi = null;
    if (disposisiList.length > 0) {
      const statuses = disposisiList.map(d => d.status);
      if (statuses.every(s => s === 'selesai')) {
        statusDisposisi = 'selesai';
      } else if (statuses.some(s => s === 'belum_dibaca')) {
        statusDisposisi = 'belum_dibaca';
      } else {
        statusDisposisi = 'diproses';
      }
    }

    // Hitung terlambat
    const today = new Date();
    const terlambat = disposisiList.some(d => 
      d.batas_waktu && new Date(d.batas_waktu) < today && d.status !== 'selesai'
    );

    // Ambil surat balasan (jika ada)
    const suratBalasan = await db('surat_keluar')
      .where('membalas_surat_masuk_id', id)
      .select('id', 'nomor_surat')
      .first();

    // Format disposisi
    const disposisiFormatted = disposisiList.map(d => ({
      id: d.id,
      penerima: { id: d.penerima_id, nama: d.penerima_nama },
      instruksi: d.instruksi,
      batas_waktu: d.batas_waktu,
      status: d.status,
      terlambat: d.batas_waktu && new Date(d.batas_waktu) < today && d.status !== 'selesai'
    }));

    // Format response sesuai kontrak §3.4
    const response = {
      id: surat.id,
      nomor_agenda: surat.nomor_agenda,
      nomor_surat: surat.nomor_surat,
      tanggal_surat: surat.tanggal_surat,
      perihal: surat.perihal,
      pengirim: surat.pengirim,
      pic: surat.pic,
      keterangan: surat.keterangan,
      status_disposisi: statusDisposisi,
      terlambat: terlambat,
      berkas: surat.file_name ? {
        nama: surat.file_name,
        ukuran: surat.file_size
      } : null,
      surat_balasan: suratBalasan ? {
        id: suratBalasan.id,
        nomor_surat: suratBalasan.nomor_surat
      } : null,
      disposisi: disposisiFormatted,
      dibuat_oleh: { id: surat.dibuat_oleh, nama: surat.pembuat_nama },
      dibuat_pada: surat.created_at
    };

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error GET /surat-masuk/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail surat masuk'
    });
  }
};

// ============================================
// POST /surat-masuk (tambah)
// ============================================
const store = async (req, res) => {
  try {
    const { 
      nomor_surat, 
      tanggal_surat, 
      pengirim, 
      perihal, 
      pic, 
      keterangan,
      jenis_input = 'manual' // 'otomatis' | 'manual'
    } = req.body;

    // Validasi dasar
    if (!tanggal_surat || !pengirim || !perihal) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: [
          { field: 'tanggal_surat', message: 'Tanggal surat wajib diisi' },
          { field: 'pengirim', message: 'Pengirim wajib diisi' },
          { field: 'perihal', message: 'Perihal wajib diisi' }
        ]
      });
    }

    // Validasi nomor_surat jika mode manual
    if (jenis_input === 'manual' && !nomor_surat) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: [
          { field: 'nomor_surat', message: 'Nomor surat wajib diisi saat mode manual' }
        ]
      });
    }

    const tahun = new Date(tanggal_surat).getFullYear();
    const nomor_agenda = await generateNomorAgenda(tahun);

    // Generate nomor_surat otomatis jika mode otomatis
    let nomor_surat_final = nomor_surat;
    if (jenis_input === 'otomatis') {
      // Format: nomor_urut/bagian.kode/perusahaan/bulan_romawi/tahun
      // misal: 0001/DIR.01/Digitak/IX/2026
      // Ambil bagian dari user yang login
      const pegawai = await db('pegawai').where({ user_id: req.user.id }).first();
      const bagian = await db('bagian').where({ id: pegawai?.bagian_id }).first();
      const kodeBagian = bagian?.kode || 'DIR';
      const row = await db('surat_masuk')
        .whereRaw('YEAR(tanggal_surat) = ?', [tahun])
        .count('* as total')
        .first();
      const nomorUrut = String(parseInt(row.total) + 1).padStart(4, '0');
      const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date(tanggal_surat).getMonth()];
      const kodeBagianFormat = kodeBagian.split('.')[0]; // ambil bagian pertama (DIR, FIN, HR, dll)
      
      // Format: nomor_urut/bagian.kode/perusahaan/bulan_romawi/tahun
      // misal: 0001/DIR.01/Digitak/IX/2026
      nomor_surat_final = `${nomorUrut}/${kodeBagianFormat}.01/Digitak/${bulanRomawi}/${tahun}`;
    }

    let file_name = null;
    let file_path = null;
    let file_size = null;

    if (req.file) {
      file_name = req.file.originalname;
      file_path = req.file.path;
      file_size = req.file.size;
    }

    const [id] = await db('surat_masuk').insert({
      nomor_agenda,
      nomor_surat: nomor_surat_final,
      tanggal_surat,
      pengirim,
      perihal,
      pic: pic || null,
      keterangan: keterangan || null,
      file_name,
      file_path,
      file_size,
      dibuat_oleh: req.user.id
    });

    const surat = await db('surat_masuk')
      .where('surat_masuk.id', id)
      .join('users as pembuat', 'surat_masuk.dibuat_oleh', 'pembuat.id')
      .select('surat_masuk.*', 'pembuat.nama as pembuat_nama')
      .first();

    return res.status(201).json({
      success: true,
      message: 'Surat masuk berhasil ditambahkan',
      data: {
        id: surat.id,
        nomor_agenda: surat.nomor_agenda,
        nomor_surat: surat.nomor_surat,
        tanggal_surat: surat.tanggal_surat,
        perihal: surat.perihal,
        pengirim: surat.pengirim,
        pic: surat.pic,
        keterangan: surat.keterangan,
        status_disposisi: null,
        terlambat: false,
        berkas: surat.file_name ? {
          nama: surat.file_name,
          ukuran: surat.file_size
        } : null,
        surat_balasan: null,
        disposisi: [],
        dibuat_oleh: { id: surat.dibuat_oleh, nama: surat.pembuat_nama },
        dibuat_pada: surat.created_at
      }
    });

  } catch (error) {
    console.error('Error POST /surat-masuk:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan surat masuk: ' + error.message
    });
  }
};

// ============================================
// GET /surat-masuk/:id/file (download)
// ============================================
const downloadFile = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const surat = await db('surat_masuk').where({ id }).first();

    if (!surat) {
      return res.status(404).json({
        success: false,
        message: 'Surat masuk tidak ditemukan'
      });
    }

    if (!surat.file_path) {
      return res.status(404).json({
        success: false,
        message: 'Surat ini tidak memiliki berkas'
      });
    }

    // Cek hak akses: pegawai hanya boleh mengunduh jika memiliki disposisi untuk surat ini
    if (userRole === 'pegawai') {
      const pegawai = await db('pegawai').where({ user_id: userId }).first();
      if (!pegawai) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses'
        });
      }

      const disposisi = await db('disposisi')
        .where({
          surat_masuk_id: id,
          kepada_pegawai_id: pegawai.id
        })
        .first();

      if (!disposisi) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke berkas surat ini'
        });
      }
    }

    const absolutePath = path.resolve(surat.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: 'Berkas tidak ditemukan di server'
      });
    }

    // Kirim file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${surat.file_name}"`);
    return res.sendFile(absolutePath);

  } catch (error) {
    console.error('Error GET /surat-masuk/:id/file:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengunduh berkas'
    });
  }
};

// ============================================
// PATCH /surat-masuk/:id/surat-balasan
// ============================================
const setSuratBalasan = async (req, res) => {
  const id = req.params.id; // surat_masuk_id
  const { surat_keluar_id } = req.body;

  if (!surat_keluar_id) {
    return res.status(400).json({
      success: false,
      message: 'surat_keluar_id wajib diisi'
    });
  }

  try {
    // Cek surat masuk
    const suratMasuk = await db('surat_masuk').where({ id }).first();
    if (!suratMasuk) {
      return res.status(404).json({
        success: false,
        message: 'Surat masuk tidak ditemukan'
      });
    }

    // Cek surat keluar
    const suratKeluar = await db('surat_keluar').where({ id: surat_keluar_id }).first();
    if (!suratKeluar) {
      return res.status(404).json({
        success: false,
        message: 'Surat keluar tidak ditemukan'
      });
    }

    // Cek apakah surat keluar sudah menjadi balasan untuk surat lain
    if (suratKeluar.membalas_surat_masuk_id !== null) {
      return res.status(409).json({
        success: false,
        message: 'Surat keluar sudah menjadi balasan untuk surat lain'
      });
    }

    // Update
    await db('surat_keluar')
      .where({ id: surat_keluar_id })
      .update({ membalas_surat_masuk_id: id });

    return res.status(200).json({
      success: true,
      message: 'Surat balasan berhasil ditautkan'
    });

  } catch (error) {
    console.error('Error PATCH /surat-masuk/:id/surat-balasan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menautkan surat balasan'
    });
  }
};

// ============================================
// DELETE /surat-masuk/:id/surat-balasan
// ============================================
const deleteSuratBalasan = async (req, res) => {
  const id = req.params.id; // surat_masuk_id

  try {
    // Cari surat keluar yang membalas surat masuk ini
    const suratKeluar = await db('surat_keluar')
      .where({ membalas_surat_masuk_id: id })
      .first();

    if (!suratKeluar) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada surat balasan yang tertaut'
      });
    }

    // Hapus tautan
    await db('surat_keluar')
      .where({ id: suratKeluar.id })
      .update({ membalas_surat_masuk_id: null });

    return res.status(200).json({
      success: true,
      message: 'Tautan surat balasan berhasil dihapus'
    });

  } catch (error) {
    console.error('Error DELETE /surat-masuk/:id/surat-balasan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus tautan surat balasan'
    });
  }
};

module.exports = {
  index,
  show,
  store,
  downloadFile,
  setSuratBalasan,
  deleteSuratBalasan
};