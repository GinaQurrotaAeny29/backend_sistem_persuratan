require('dotenv').config();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// === LOGO ===
const logoPath = path.join(__dirname, '../../../frontend/templatesurat/logo.png');
let logoBase64 = '';
try {
  const buf = fs.readFileSync(logoPath);
  logoBase64 = buf.toString('base64');
} catch (e) {
  console.warn('[LOGO] tidak ditemukan:', e.message);
}

// === KOP: 1 garis solid emas ===
function kop() {
  const logoTag = logoBase64
    ? '<img src="data:image/png;base64,' + logoBase64 + '" style="width:90px;height:auto;display:block;" />'
    : '<div style="width:90px;height:60px;border:1px solid #ccc;">LOGO</div>';
  return '<table style="width:100%;border-collapse:collapse;margin-bottom:4px;"><tr>'
    + '<td style="width:100px;vertical-align:middle;padding-right:16px;">' + logoTag + '</td>'
    + '<td style="vertical-align:middle;text-align:right;">'
    + '<p style="font-size:16pt;font-weight:bold;color:#3D2312;margin:0 0 4px 0;">PT METANOUVA INFORMATIKA</p>'
    + '<p style="font-size:9pt;margin:0;">Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26,</p>'
    + '<p style="font-size:9pt;margin:0;">Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>'
    + '<p style="font-size:9pt;margin:2px 0 0 0;">Email: info@digitak.id  |  Web: https://digitak.id/</p>'
    + '</td></tr></table>'
    + '<hr style="border:none;border-top:2px solid #D27A0F;margin:12px 0 18px 0;" />';
}

// === Header nomor surat (WAJIB tampil) ===
function headerNomor() {
  return '<table style="width:100%;font-size:10.5pt;margin-top:6px;border-collapse:collapse;">'
    + '<tr><td style="width:70px;font-weight:bold;">Nomor</td><td>: {nomor_surat}</td></tr>'
    + '<tr><td style="font-weight:bold;">Lampiran</td><td>: -</td></tr>'
    + '<tr><td style="font-weight:bold;">Perihal</td><td>: {perihal}</td></tr>'
    + '</table>';
}

// === Footer tanda tangan (satu orang) ===
function footerTunggal(namaField) {
  return '<p style="font-size:10.5pt;margin-top:28px;text-align:right;">{kota}, {tanggal}</p>'
    + '<p style="font-size:10.5pt;text-align:right;">DIGITAK</p>'
    + '<p style="font-size:10.5pt;margin-top:8px;text-align:right;"></p>' // ruang tanda tangan
    + '<p style="font-size:10.5pt;margin-top:44px;text-align:right;font-weight:bold;">{' + namaField + '}</p>'
    + '<p style="font-size:10.5pt;margin:0;text-align:right;">Direktur Utama</p>';
}

// === Footer dua pihak ===
function footerDua() {
  return '<p style="font-size:10.5pt;margin-top:28px;text-align:right;">{kota}, {tanggal}</p>'
    + '<table style="width:100%;margin-top:40px;font-size:10.5pt;border-collapse:collapse;">'
    + '<tr>'
    + '<td style="width:50%;text-align:center;vertical-align:bottom;padding-right:16px;">'
    + '<p style="font-weight:bold;">{nama_pihak1}</p><p>{jabatan_pihak1}</p></td>'
    + '<td style="width:50%;text-align:center;vertical-align:bottom;padding-left:16px;">'
    + '<p style="font-weight:bold;">{nama_pihak2}</p><p>{jabatan_pihak2}</p></td>'
    + '</tr></table>';
}

async function run() {
  try {
    // Ambil semua template + jenis + field
    const templates = await db('template_surat')
      .leftJoin('jenis_surat', 'template_surat.jenis_surat_id', 'jenis_surat.id')
      .select('template_surat.*', 'jenis_surat.kode as js_kode', 'jenis_surat.nama as js_nama');

    let ok = 0;
    for (const t of templates) {
      const fields = await db('template_field')
        .where({ template_id: t.id })
        .select('field_key', 'label', 'tipe', 'is_required');

      const keys = fields.map(f => f.field_key);
      const isDuaPihak = keys.some(k => k.startsWith('nama_pihak'));
      const punyaIsi = keys.includes('isi');
      const punyaKet = keys.includes('keterangan');
      const punyaMenimbang = keys.includes('menimbang');
      const namaField = keys.includes('nama_penandatangan') ? 'nama_penandatangan'
        : keys.includes('nama_direktur') ? 'nama_direktur'
          : keys.includes('nama_pejabat') ? 'nama_pejabat'
            : 'nama_penandatangan';

      let html = kop()
        + headerNomor()
        + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>';

      if (punyaKet) {
        html += '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>';
      }
      if (punyaMenimbang) {
        html += '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">Menimbang: {menimbang}</p>'
          + '<p style="font-size:10.5pt;margin-top:6px;text-align:justify;">Mengingat: {mengingat}</p>'
          + '<p style="font-size:10.5pt;margin-top:6px;text-align:justify;">Memutuskan: {memutuskan}</p>';
      }

      html += isDuaPihak ? footerDua() : footerTunggal(namaField);

      // Pastikan field 'nomor_surat' & 'perihal' tersedia (diisi sistem/kolom tetap)
      // 'nomor_surat' & 'perihal' dipakai HTML; perihal diambil dari isian kolom tetap.

      await db('template_surat').where({ id: t.id }).update({ konten_html: html });
      ok++;
    }
    console.log('[DONE] ' + ok + ' template HTML diperbaiki (pakai nomor surat)');
    process.exit(0);
  } catch (err) {
    console.error('Gagal:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();