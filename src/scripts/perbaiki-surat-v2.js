/**
 * PERBAIKAN v3 — lanjutan dari perbaiki-surat-v2.js
 * =========================================================================
 * perbaiki-surat-final.js dan perbaiki-surat-v2.js masih boleh ada sebagai
 * arsip, tapi jangan dijalankan lagi setelah ini — script ini superset-nya
 * (dipanggil dengan cara yang persis sama).
 *
 * Ringkasan perbaikan v1 & v2 (tetap dipertahankan di v3):
 * 1. Baris "Dari" pada info surat dihapus.
 * 2. Blok tanda tangan rata kanan lewat <div style="text-align:right">.
 * 3. Titik dua (:) pada Nomor/Kepada/Tanggal/Perihal sejajar (tabel 3 kolom).
 *
 * Perbaikan baru di v3:
 *
 * 4. Kepada/Perihal/Tanggal Surat tampil DOBEL — sekali di tabel info surat
 *    di atas (Nomor/Kepada/Tanggal/Perihal), sekali lagi di bawah isi surat
 *    sebagai paragraf "Kepada: axel", "Perihal: Keputusan", dst.
 *    Akar masalah: template_field milik template ini ternyata juga punya
 *    baris field_key 'kepada', 'perihal', dan 'tanggal_surat' (selain field
 *    tetap yang sudah dikirim controller sebagai kolom terpisah). Karena
 *    bangunKonten() mencetak SEMUA field yang belum "dipakai" sebagai
 *    paragraf tambahan, ketiga field itu ikut tercetak lagi di bawah,
 *    padahal isinya sudah tampil di tabel info surat paling atas.
 *    Fix: 'kepada', 'perihal', 'tanggal_surat', dan 'nomor_surat' sekarang
 *    ikut masuk daftar field yang TIDAK dicetak ulang sebagai paragraf
 *    tambahan — sama seperti 'isi', 'jabatan', 'dari', 'pic' sebelumnya.
 *
 * Cara pakai:
 *   node src/scripts/perbaiki-surat-v3.js
 *
 * Aman dijalankan berkali-kali (idempotent) — konten_html lama (apa pun
 * isinya, termasuk yang sudah diedit manual lewat Data Master Template)
 * selalu ditimpa habis dengan versi baru yang konsisten. Field kustom
 * (menimbang, keterangan, item_deskripsi, dst.) yang sudah ada di
 * template_field TETAP dipertahankan dan otomatis ditambahkan sebagai
 * paragraf baru sebelum blok tanda tangan.
 */
require('dotenv').config();
const db = require('../config/db');

// ============================================
// KOP SURAT — logo kiri, identitas perusahaan kanan, garis emas di bawah.
// Tidak berubah dari v1.
// ============================================
function kopSurat() {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 4px 0;">
  <tr>
    <td style="width:130px;vertical-align:middle;padding:0 16px 0 0;">
      <img src="{logo_perusahaan}" style="width:110px;height:auto;display:block;max-width:100%;" alt="Logo PT Metanouva Informatika" />
    </td>
    <td style="vertical-align:middle;text-align:right;">
      <p style="margin:0 0 4px 0;font-size:16pt;font-weight:bold;color:#3D2312;letter-spacing:0.5px;">PT. METANOUVA INFORMATIKA</p>
      <p style="margin:0;font-size:9pt;color:#333333;">Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Pasirkaliki,</p>
      <p style="margin:0;font-size:9pt;color:#333333;">Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>
      <p style="margin:2px 0 0 0;font-size:9pt;color:#333333;">info@digitak.id&nbsp;&nbsp;|&nbsp;&nbsp;digitak.id</p>
    </td>
  </tr>
</table>
<hr style="border:none;border-top:3px solid #D27A0F;margin:10px 0 20px 0;" />`;
}

// ============================================
// INFO SURAT — Nomor, Kepada, Tanggal, Perihal ("Dari" sengaja tidak ada
// lagi di v2). Satu <table>, tiap baris = 1 <tr> dengan 3 kolom
// (label, ":", isi), jadi label dan isinya PASTI selalu satu baris, dan
// semua titik dua sejajar karena kolom ":" punya lebar tetap yang sama.
// ============================================
function infoSurat() {
  const baris = (label, placeholder) => `  <tr>
    <td style="width:78px;padding:2px 0;vertical-align:top;">${label}</td>
    <td style="width:14px;padding:2px 0;vertical-align:top;">:</td>
    <td style="padding:2px 0;vertical-align:top;">${placeholder}</td>
  </tr>`;

  return `<table style="width:100%;font-size:11pt;margin:0 0 20px 0;border-collapse:collapse;">
${baris('Nomor', '{nomor_surat}')}
${baris('Kepada', '{kepada}')}
${baris('Tanggal', '{tanggal_surat}')}
${baris('Perihal', '{perihal}')}
</table>`;
}

// ============================================
// TANDA TANGAN — rata kanan lewat text-align:right pada satu <div> yang
// membungkus semua barisnya (bukan tabel 2 kolom seperti v1) — jatuh SETELAH
// isi surat selesai (alur dokumen normal, bukan position:absolute), dan
// tetap rata kanan di kondisi apa pun.
// ============================================
function ttdSurat() {
  return `<div style="width:100%;text-align:right;margin-top:8px;font-size:11pt;">
  <p style="margin:0 0 8px 0;font-weight:bold;">Hormat kami,</p>
  <div style="height:56px;">&nbsp;</div>
  <p style="margin:0;font-weight:bold;text-decoration:underline;">{pic}</p>
  <p style="margin:2px 0 0 0;">{jabatan}</p>
</div>`;
}

// Field yang sudah dipakai eksplisit di kop/info/ttd — tidak perlu
// diulang lagi sebagai paragraf tambahan generik. "dari" tetap masuk daftar
// ini supaya, kalaupun template lama masih punya field itu, ia tidak
// muncul dobel sebagai paragraf "Dari: ..." di bawah isi surat.
// "kepada", "perihal", "tanggal_surat" dan "nomor_surat" ditambahkan di v3
// supaya, kalau template_field-nya kebetulan juga punya baris dengan
// field_key itu, isinya tidak tercetak dua kali (sekali di tabel info
// surat paling atas, sekali lagi sebagai paragraf di bawah isi surat).
const FIELD_SUDAH_DIPAKAI = new Set([
  'isi',
  'jabatan',
  'dari',
  'pic',
  'kepada',
  'perihal',
  'tanggal_surat',
  'nomor_surat',
]);

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Susun konten_html lengkap untuk satu template, berdasarkan field-field
 * dinamis yang sudah terdaftar untuknya (supaya field kustom seperti
 * "menimbang", "keterangan", dsb tetap ada, tidak hilang).
 */
function bangunKonten(fields) {
  const keys = fields.map((f) => f.field_key);

  let html = kopSurat() + '\n\n' + infoSurat() + '\n\n';
  html += '<p style="margin:0 0 10px 0;font-size:11pt;">Dengan hormat,</p>\n\n';

  if (keys.includes('isi')) {
    html += '<p style="margin:0 0 16px 0;font-size:11pt;text-align:justify;text-indent:1.25cm;">{isi}</p>\n\n';
  }

  // Field dinamis lain di luar isi/jabatan/dari/pic — tetap ditampilkan,
  // urut sesuai kolom "urutan" di template_field, sebagai paragraf berlabel.
  const fieldTambahan = fields
    .filter((f) => !FIELD_SUDAH_DIPAKAI.has(f.field_key))
    .sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

  for (const f of fieldTambahan) {
    html += `<p style="margin:0 0 12px 0;font-size:11pt;text-align:justify;"><b>${escapeHtml(f.label)}:</b> {${f.field_key}}</p>\n\n`;
  }

  html += '<p style="margin:0 0 40px 0;font-size:11pt;text-align:justify;">Demikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>\n\n';
  html += ttdSurat();

  return html;
}

async function run() {
  try {
    const templates = await db('template_surat').select('id', 'nama');

    let diperbaiki = 0;

    for (const t of templates) {
      let fields = await db('template_field')
        .where({ template_id: t.id })
        .select('id', 'field_key', 'label', 'tipe', 'urutan');

      const keys = fields.map((f) => f.field_key);

      // Pastikan field 'jabatan' selalu tersedia supaya bisa diisi lewat
      // form. 'dari' TIDAK lagi ditambahkan otomatis di v2 — sudah tidak
      // dicetak, jadi tidak perlu dipaksa ada.
      if (!keys.includes('jabatan')) {
        await db('template_field').insert({
          template_id: t.id,
          field_key: 'jabatan',
          label: 'Jabatan Penandatangan',
          tipe: 'text',
          is_required: 0,
          urutan: 99,
        });
        fields = await db('template_field')
          .where({ template_id: t.id })
          .select('id', 'field_key', 'label', 'tipe', 'urutan');
      }

      const kontenBaru = bangunKonten(fields);
      await db('template_surat').where({ id: t.id }).update({ konten_html: kontenBaru });

      diperbaiki++;
      console.log(`[OK] Template #${t.id} (${t.nama}) — tata letak diperbarui.`);
    }

    console.log(`\n[SELESAI] ${diperbaiki} template diperbarui.`);
    process.exit(0);
  } catch (err) {
    console.error('Gagal menjalankan perbaikan:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();