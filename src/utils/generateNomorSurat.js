const db = require('../config/db');
const { keRomawi } = require('./romawi');

// ============================================
// Generate nomor surat keluar
// Dipanggil di dalam transaksi utama (parameter trx)
// ============================================
const generateNomorSurat = async (trx, tanggalSurat, jenisSurat) => {
  // 1. Tentukan tahun dari tanggal_surat (bukan hari ini) — K-6
  const tanggal = new Date(tanggalSurat);
  const tahun = tanggal.getFullYear();
  const bulan = tanggal.getMonth() + 1;

  // 2. Ambil pengaturan dari app_setting
  const settings = await trx('app_setting').select('kunci', 'nilai');
  const map = {};
  settings.forEach((s) => { map[s.kunci] = s.nilai; });

  const formatNomor = map.format_nomor;
  const kodePerusahaan = map.kode_perusahaan;
  const panjangUrut = parseInt(map.panjang_nomor_urut || '3', 10);

  // 3. Kunci baris counter (FOR UPDATE) — B-2
  // Pastikan baris counter ada (insert jika belum ada)
  await trx.raw(
    `INSERT INTO counter (kunci, tahun, nomor_terakhir, created_at, updated_at)
     VALUES ('nomor_surat_keluar', ?, 0, NOW(), NOW())
     ON DUPLICATE KEY UPDATE kunci = kunci`,
    [tahun]
  );

  const counter = await trx('counter')
    .where({ kunci: 'nomor_surat_keluar', tahun })
    .select('nomor_terakhir')
    .forUpdate()
    .first();

  const nomorBaru = counter.nomor_terakhir + 1;

  // 4. Simpan nomor baru ke counter
  await trx('counter')
    .where({ kunci: 'nomor_surat_keluar', tahun })
    .update({ nomor_terakhir: nomorBaru, updated_at: new Date() });

  // 5. Rakit nomor
  const urutStr = String(nomorBaru).padStart(panjangUrut, '0');
  const bulanRomawi = keRomawi(bulan);

  // Konvensi di data seeder: jenis_surat.kode sudah termasuk prefix bagian
  // misal "FIN.03" (artinya bagian FIN, kode 03).
  // Format template: {urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}
  // Jadi {bagian}.{kode} digantikan oleh jenis_surat.kode langsung.
  const nomorSurat = formatNomor
    .replace('{urut}', urutStr)
    .replace('{bagian}.{kode}', jenisSurat.kode)
    .replace('{bagian}', jenisSurat.bagian_kode || '')
    .replace('{kode}', jenisSurat.kode)
    .replace('{perusahaan}', kodePerusahaan)
    .replace('{bulan_romawi}', bulanRomawi)
    .replace('{tahun}', tahun);

  return { nomorSurat, nomorUrut: nomorBaru, tahun };
};

module.exports = generateNomorSurat;