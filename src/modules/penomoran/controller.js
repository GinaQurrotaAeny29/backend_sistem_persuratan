const db = require('../../config/db');

// ============================================
// GET /master/penomoran
// ============================================
const show = async (req, res) => {
  try {
    // Ambil semua pengaturan dalam bentuk key-value
    const settings = await db('app_setting').select('kunci', 'nilai');
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.kunci] = s.nilai;
    });

    // Ambil counter (kunci = nomor_surat_keluar)
    const counters = await db('counter')
      .where({ kunci: 'nomor_surat_keluar' })
      .select('tahun', 'nomor_terakhir')
      .orderBy('tahun', 'desc');

    // Ambil riwayat perubahan
    const riwayat = await db('riwayat_penomoran')
      .join('users', 'riwayat_penomoran.aktor_id', 'users.id')
      .select(
        'riwayat_penomoran.id',
        'riwayat_penomoran.field',
        'riwayat_penomoran.nilai_lama',
        'riwayat_penomoran.nilai_baru',
        'riwayat_penomoran.waktu',
        'users.nama as aktor_nama'
      )
      .orderBy('riwayat_penomoran.waktu', 'desc')
      .limit(50);

    // Buat contoh nomor (dari counter terakhir tahun berjalan)
    const tahunBerjalan = new Date().getFullYear();
    const counterTahunIni = counters.find((c) => c.tahun === tahunBerjalan);
    const urutNext = (counterTahunIni ? counterTahunIni.nomor_terakhir : 0) + 1;
    const panjang = parseInt(settingsMap.panjang_nomor_urut || '3', 10);
    const urutStr = String(urutNext).padStart(panjang, '0');

    // Asumsi contoh: bagian "FIN.03", bulan romawi dari tanggal hari ini
    const { keRomawi } = require('../../utils/romawi');
    const bulanRomawi = keRomawi(new Date().getMonth() + 1);
    const contoh = `${urutStr}/FIN.03/${settingsMap.kode_perusahaan}/${bulanRomawi}/${tahunBerjalan}`;

    return res.status(200).json({
      success: true,
      data: {
        format_nomor: settingsMap.format_nomor,
        kode_perusahaan: settingsMap.kode_perusahaan,
        panjang_nomor_urut: parseInt(settingsMap.panjang_nomor_urut || '3', 10),
        cakupan: settingsMap.cakupan_penomoran,
        contoh,
        counter: counters.map((c) => ({
          tahun: c.tahun,
          nomor_terakhir: c.nomor_terakhir
        })),
        riwayat_perubahan: riwayat.map((r) => ({
          waktu: r.waktu,
          aktor: r.aktor_nama,
          field: r.field,
          nilai_lama: r.nilai_lama,
          nilai_baru: r.nilai_baru
        }))
      }
    });
  } catch (error) {
    console.error('Error GET /master/penomoran:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan penomoran'
    });
  }
};

// ============================================
// PUT /master/penomoran
// Body: { format_nomor?, kode_perusahaan?, panjang_nomor_urut?, cakupan? }
// ============================================
const update = async (req, res) => {
  const { format_nomor, kode_perusahaan, panjang_nomor_urut, cakupan } = req.body;
  const aktorId = req.user.id;

  try {
    // Ambil pengaturan lama untuk perbandingan
    const settings = await db('app_setting').select('kunci', 'nilai');
    const oldMap = {};
    settings.forEach((s) => {
      oldMap[s.kunci] = s.nilai;
    });

    // Validasi format nomor (harus mengandung placeholder penting)
    if (format_nomor) {
      const wajib = ['{urut}', '{bulan_romawi}', '{tahun}'];
      const missing = wajib.filter((p) => !format_nomor.includes(p));
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Format nomor harus mengandung: ${missing.join(', ')}`
        });
      }
    }

    // Validasi panjang nomor
    if (panjang_nomor_urut !== undefined) {
      const p = parseInt(panjang_nomor_urut, 10);
      if (isNaN(p) || p < 1 || p > 6) {
        return res.status(400).json({
          success: false,
          message: 'Panjang nomor urut harus antara 1-6 digit'
        });
      }
    }

    // Validasi cakupan
    if (cakupan && !['global_per_tahun', 'per_bagian'].includes(cakupan)) {
      return res.status(400).json({
        success: false,
        message: 'Cakupan harus "global_per_tahun" atau "per_bagian"'
      });
    }

    // Siapkan update
    const updates = [];
    if (format_nomor && format_nomor !== oldMap.format_nomor) {
      updates.push({ kunci: 'format_nomor', nilai: format_nomor, field: 'format_nomor', lama: oldMap.format_nomor, baru: format_nomor });
    }
    if (kode_perusahaan && kode_perusahaan !== oldMap.kode_perusahaan) {
      updates.push({ kunci: 'kode_perusahaan', nilai: kode_perusahaan, field: 'kode_perusahaan', lama: oldMap.kode_perusahaan, baru: kode_perusahaan });
    }
    if (panjang_nomor_urut !== undefined && String(panjang_nomor_urut) !== oldMap.panjang_nomor_urut) {
      updates.push({ kunci: 'panjang_nomor_urut', nilai: String(panjang_nomor_urut), field: 'panjang_nomor_urut', lama: oldMap.panjang_nomor_urut, baru: String(panjang_nomor_urut) });
    }
    if (cakupan && cakupan !== oldMap.cakupan_penomoran) {
      updates.push({ kunci: 'cakupan_penomoran', nilai: cakupan, field: 'cakupan_penomoran', lama: oldMap.cakupan_penomoran, baru: cakupan });
    }

    if (updates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada perubahan'
      });
    }

    // Transaksi: update app_setting + catat riwayat
    await db.transaction(async (trx) => {
      for (const u of updates) {
        await trx('app_setting')
          .where({ kunci: u.kunci })
          .update({ nilai: u.nilai, updated_at: new Date() });

        await trx('riwayat_penomoran').insert({
          aktor_id: aktorId,
          field: u.field,
          nilai_lama: u.lama,
          nilai_baru: u.baru,
          waktu: new Date()
        });
      }
    });

    // Ambil ulang data terbaru
    const settingsNow = await db('app_setting').select('kunci', 'nilai');
    const settingsMapNow = {};
    settingsNow.forEach((s) => { settingsMapNow[s.kunci] = s.nilai; });

    const countersNow = await db('counter')
      .where({ kunci: 'nomor_surat_keluar' })
      .select('tahun', 'nomor_terakhir')
      .orderBy('tahun', 'desc');

    const riwayatNow = await db('riwayat_penomoran')
      .join('users', 'riwayat_penomoran.aktor_id', 'users.id')
      .select(
        'riwayat_penomoran.field',
        'riwayat_penomoran.nilai_lama',
        'riwayat_penomoran.nilai_baru',
        'riwayat_penomoran.waktu',
        'users.nama as aktor'
      )
      .orderBy('riwayat_penomoran.waktu', 'desc')
      .limit(50);

    return res.status(200).json({
      success: true,
      message: `Berhasil mengubah ${updates.length} pengaturan`,
      data: {
        format_nomor: settingsMapNow.format_nomor,
        kode_perusahaan: settingsMapNow.kode_perusahaan,
        panjang_nomor_urut: parseInt(settingsMapNow.panjang_nomor_urut || '3', 10),
        cakupan: settingsMapNow.cakupan_penomoran,
        counter: countersNow.map((c) => ({
          tahun: c.tahun, nomor_terakhir: c.nomor_terakhir
        })),
        riwayat_perubahan: riwayatNow.map((r) => ({
          waktu: r.waktu,
          aktor: r.aktor,
          field: r.field,
          nilai_lama: r.nilai_lama,
          nilai_baru: r.nilai_baru
        }))
      }
    });
  } catch (error) {
    console.error('Error PUT /master/penomoran:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengubah pengaturan penomoran'
    });
  }
};

module.exports = { show, update };