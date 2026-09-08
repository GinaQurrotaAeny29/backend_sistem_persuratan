const db = require('../../config/db');

// ============================================
// POST /surat-masuk/:id/disposisi (Admin)
// ============================================
const store = async (req, res) => {
  const suratMasukId = req.params.id;
  const { pegawai_id, instruksi, batas_waktu } = req.body;

  // Validasi
  if (!pegawai_id || !instruksi || !batas_waktu) {
    const errors = [];
    if (!pegawai_id) errors.push({ field: 'pegawai_id', message: 'Penerima disposisi wajib dipilih' });
    if (!instruksi) errors.push({ field: 'instruksi', message: 'Instruksi wajib diisi' });
    if (!batas_waktu) errors.push({ field: 'batas_waktu', message: 'Batas waktu wajib diisi' });
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors
    });
  }

  try {
    // Cek apakah surat masuk ada
    const surat = await db('surat_masuk').where({ id: suratMasukId }).first();
    if (!surat) {
      return res.status(404).json({
        success: false,
        message: 'Surat masuk tidak ditemukan'
      });
    }

    // Cek apakah pegawai penerima punya akun aktif
    const pegawai = await db('pegawai')
      .join('users', 'pegawai.user_id', 'users.id')
      .where('pegawai.id', pegawai_id)
      .where('users.status', 'aktif')
      .where('pegawai.status', 'aktif')
      .select('pegawai.id', 'pegawai.nama')
      .first();

    if (!pegawai) {
      return res.status(400).json({
        success: false,
        message: 'Pegawai penerima tidak valid atau tidak memiliki akun aktif'
      });
    }

    // Dapatkan pegawai_id dari admin (yang login)
    const adminPegawai = await db('pegawai')
      .where({ user_id: req.user.id })
      .where('status', 'aktif')
      .select('id')
      .first();

    if (!adminPegawai) {
      return res.status(403).json({
        success: false,
        message: 'Admin tidak memiliki data pegawai terkait'
      });
    }

    // Transaksi
    const result = await db.transaction(async (trx) => {
      const [disposisiId] = await trx('disposisi').insert({
        surat_masuk_id: suratMasukId,
        dari_pegawai_id: adminPegawai.id,
        kepada_pegawai_id: pegawai_id,
        instruksi,
        batas_waktu,
        status: 'belum_dibaca'
      });

      await trx('riwayat_disposisi').insert({
        disposisi_id: disposisiId,
        aktor_id: req.user.id,
        status_lama: null,
        status_baru: 'belum_dibaca',
        catatan: 'Disposisi dibuat oleh ' + req.user.nama
      });

      await trx('notifikasi').insert({
        pegawai_id: pegawai_id,
        jenis: 'disposisi_baru',
        judul: 'Disposisi Baru dari ' + req.user.nama,
        keterangan: 'Surat: ' + surat.perihal,
        tautan_tipe: 'disposisi',
        tautan_id: disposisiId,
        waktu: new Date()
      });

      return disposisiId;
    });

    const newDisposisi = await db('disposisi')
      .where('disposisi.id', result)
      .join('pegawai as pemberi', 'disposisi.dari_pegawai_id', 'pemberi.id')
      .join('pegawai as penerima', 'disposisi.kepada_pegawai_id', 'penerima.id')
      .select(
        'disposisi.*',
        'pemberi.nama as pemberi_nama',
        'penerima.nama as penerima_nama'
      )
      .first();

    return res.status(201).json({
      success: true,
      message: 'Disposisi berhasil dibuat',
      data: newDisposisi
    });

  } catch (error) {
    console.error('Error POST /surat-masuk/:id/disposisi:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat disposisi: ' + error.message
    });
  }
};

// ============================================
// GET /disposisi/saya (Pegawai melihat disposisi yang diterima)
// ============================================
const indexSaya = async (req, res) => {
  try {
    const pegawaiId = req.user.pegawai_id;

    const data = await db('disposisi')
      .where('disposisi.kepada_pegawai_id', pegawaiId)
      .join('surat_masuk', 'disposisi.surat_masuk_id', 'surat_masuk.id')
      .join('pegawai as pemberi', 'disposisi.dari_pegawai_id', 'pemberi.id')
      .select(
        'disposisi.id',
        'disposisi.status',
        'disposisi.instruksi',
        'disposisi.batas_waktu',
        'disposisi.created_at as dibuat_pada',
        'disposisi.selesai_pada',
        'surat_masuk.id as surat_id',
        'surat_masuk.nomor_agenda',
        'surat_masuk.perihal',
        'surat_masuk.pengirim'
      )
      .orderBy('disposisi.created_at', 'desc');

    const semua = data.length;
    const belum_dibaca = data.filter(d => d.status === 'belum_dibaca').length;
    const diproses = data.filter(d => d.status === 'diproses').length;
    const selesai = data.filter(d => d.status === 'selesai').length;

    return res.status(200).json({
      success: true,
      data: data,
      meta: {
        hitungan: { semua, belum_dibaca, diproses, selesai }
      }
    });

  } catch (error) {
    console.error('Error GET /disposisi/saya:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data disposisi'
    });
  }
};

// ============================================
// GET /disposisi/:id (Detail disposisi)
// ============================================
const show = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const disposisi = await db('disposisi')
      .where('disposisi.id', id)
      .join('surat_masuk', 'disposisi.surat_masuk_id', 'surat_masuk.id')
      .join('pegawai as pemberi', 'disposisi.dari_pegawai_id', 'pemberi.id')
      .join('pegawai as penerima', 'disposisi.kepada_pegawai_id', 'penerima.id')
      .join('users as pemberi_user', 'pemberi.user_id', 'pemberi_user.id')
      .select(
        'disposisi.*',
        'surat_masuk.id as surat_id',
        'surat_masuk.nomor_agenda',
        'surat_masuk.nomor_surat',
        'surat_masuk.perihal',
        'surat_masuk.pengirim',
        'surat_masuk.file_name',
        'surat_masuk.file_path',
        'pemberi.nama as pemberi_nama',
        'pemberi_user.role as pemberi_role',
        'penerima.nama as penerima_nama'
      )
      .first();

    if (!disposisi) {
      return res.status(404).json({
        success: false,
        message: 'Disposisi tidak ditemukan'
      });
    }

    if (userRole === 'pegawai') {
      const pegawai = await db('pegawai').where({ user_id: userId }).first();
      if (!pegawai || pegawai.id !== disposisi.kepada_pegawai_id) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke disposisi ini'
        });
      }
    }

    const terlambat = disposisi.batas_waktu && 
      new Date(disposisi.batas_waktu) < new Date() && 
      disposisi.status !== 'selesai';

    const response = {
      id: disposisi.id,
      status: disposisi.status,
      terlambat: terlambat,
      instruksi: disposisi.instruksi,
      batas_waktu: disposisi.batas_waktu,
      hasil_tindak_lanjut: disposisi.hasil_tindak_lanjut,
      pemberi: {
        id: disposisi.dari_pegawai_id,
        nama: disposisi.pemberi_nama,
        role: disposisi.pemberi_role
      },
      penerima: {
        id: disposisi.kepada_pegawai_id,
        nama: disposisi.penerima_nama
      },
      dibuat_pada: disposisi.created_at,
      dibaca_pada: disposisi.dibaca_pada,
      selesai_pada: disposisi.selesai_pada,
      surat: {
        id: disposisi.surat_id,
        nomor_agenda: disposisi.nomor_agenda,
        perihal: disposisi.perihal,
        pengirim: disposisi.pengirim,
        berkas: disposisi.file_name ? { nama: disposisi.file_name } : null
      }
    };

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error GET /disposisi/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail disposisi'
    });
  }
};

// ============================================
// PATCH /disposisi/:id/baca (Tandai sudah dibaca)
// ============================================
const tandaiBaca = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  try {
    const disposisi = await db('disposisi')
      .where('disposisi.id', id)
      .join('pegawai', 'disposisi.kepada_pegawai_id', 'pegawai.id')
      .select('disposisi.*', 'pegawai.user_id')
      .first();

    if (!disposisi) {
      return res.status(404).json({
        success: false,
        message: 'Disposisi tidak ditemukan'
      });
    }

    if (disposisi.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan penerima disposisi ini'
      });
    }

    if (disposisi.status !== 'belum_dibaca') {
      return res.status(200).json({
        success: true,
        message: 'Disposisi sudah dibaca sebelumnya'
      });
    }

    await db.transaction(async (trx) => {
      await trx('disposisi')
        .where({ id })
        .update({
          status: 'diproses',
          dibaca_pada: new Date()
        });

      await trx('riwayat_disposisi').insert({
        disposisi_id: id,
        aktor_id: userId,
        status_lama: 'belum_dibaca',
        status_baru: 'diproses',
        catatan: 'Disposisi dibaca oleh penerima'
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Disposisi ditandai sudah dibaca'
    });

  } catch (error) {
    console.error('Error PATCH /disposisi/:id/baca:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status disposisi'
    });
  }
};

// ============================================
// PATCH /disposisi/:id/status (Ubah status)
// ============================================
const ubahStatus = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const { status, hasil_tindak_lanjut } = req.body;

  if (!status || !['diproses', 'selesai'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status hanya boleh "diproses" atau "selesai"'
    });
  }

  try {
    const disposisi = await db('disposisi')
      .where('disposisi.id', id)
      .join('pegawai', 'disposisi.kepada_pegawai_id', 'pegawai.id')
      .select('disposisi.*', 'pegawai.user_id')
      .first();

    if (!disposisi) {
      return res.status(404).json({
        success: false,
        message: 'Disposisi tidak ditemukan'
      });
    }

    if (disposisi.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda bukan penerima disposisi ini'
      });
    }

    if (disposisi.status === 'selesai') {
      return res.status(409).json({
        success: false,
        message: 'Disposisi sudah selesai, tidak dapat diubah lagi'
      });
    }

    if (disposisi.status === 'belum_dibaca' && status === 'selesai') {
      return res.status(409).json({
        success: false,
        message: 'Disposisi harus dibaca/diproses terlebih dahulu sebelum selesai'
      });
    }

    await db.transaction(async (trx) => {
      const updateData = { status };
      if (status === 'selesai') updateData.selesai_pada = new Date();
      if (hasil_tindak_lanjut) updateData.hasil_tindak_lanjut = hasil_tindak_lanjut;

      await trx('disposisi').where({ id }).update(updateData);

      await trx('riwayat_disposisi').insert({
        disposisi_id: id,
        aktor_id: userId,
        status_lama: disposisi.status,
        status_baru: status,
        catatan: hasil_tindak_lanjut || null
      });

      if (status === 'selesai') {
        await trx('notifikasi').insert({
          pegawai_id: disposisi.dari_pegawai_id,
          jenis: 'disposisi_selesai',
          judul: 'Disposisi selesai diproses',
          keterangan: `Disposisi untuk surat "${disposisi.perihal}" telah selesai`,
          tautan_tipe: 'disposisi',
          tautan_id: id,
          waktu: new Date()
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: `Status disposisi berhasil diubah menjadi ${status}`
    });

  } catch (error) {
    console.error('Error PATCH /disposisi/:id/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah status disposisi'
    });
  }
};

// ============================================
// GET /disposisi/:id/riwayat
// ============================================
const riwayat = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const disposisi = await db('disposisi')
      .where('id', id)
      .join('pegawai as penerima', 'disposisi.kepada_pegawai_id', 'penerima.id')
      .select('disposisi.*', 'penerima.user_id as penerima_user_id')
      .first();

    if (!disposisi) {
      return res.status(404).json({
        success: false,
        message: 'Disposisi tidak ditemukan'
      });
    }

    if (userRole === 'pegawai' && disposisi.penerima_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke riwayat disposisi ini'
      });
    }

    const data = await db('riwayat_disposisi')
      .where('disposisi_id', id)
      .join('users', 'riwayat_disposisi.aktor_id', 'users.id')
      .select(
        'riwayat_disposisi.id',
        'riwayat_disposisi.status_lama',
        'riwayat_disposisi.status_baru',
        'riwayat_disposisi.catatan',
        'riwayat_disposisi.waktu',
        'users.id as aktor_id',
        'users.nama as aktor_nama'
      )
      .orderBy('riwayat_disposisi.waktu', 'asc');

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error GET /disposisi/:id/riwayat:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat disposisi'
    });
  }
};

// ============================================
// EXPORT SEMUA FUNGSI
// ============================================
module.exports = { 
  store, 
  indexSaya, 
  show, 
  tandaiBaca, 
  ubahStatus,
  riwayat 
};