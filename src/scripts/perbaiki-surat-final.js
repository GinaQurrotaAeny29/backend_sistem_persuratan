/**
 * PERBAIKAN FINAL — tata letak surat (kop, nomor, info surat, tanda tangan)
 * =========================================================================
 * Menggantikan efek dari perbaiki-kop-final.js, perbaiki-template.js dan
 * update-template.js (skrip-skrip itu boleh tetap ada sebagai arsip, tapi
 * jangan dijalankan lagi setelah ini — script ini superset-nya).
 *
 * Masalah yang diperbaiki (dilaporkan lewat pratinjau & hasil cetak PDF):
 *
 * 1. LOGO CUMA MUNCUL SEDIKIT
 *    Akar masalah: base64 logo yang ditempel manual di beberapa file source
 *    (renderPDF.js, perbaiki-kop-final.js) ternyata TERPOTONG/corrupt.
 *    Fix: logo sekarang selalu diambil langsung dari file asli
 *    storage/public/logo.png lewat placeholder {logo_perusahaan}, tidak
 *    pernah ditempel manual sebagai teks base64 lagi.
 *
 * 2. "Nomor" dan ": <nomor surat>" tampil di baris terpisah, harusnya
 *    "Nomor : <nomor surat>" dalam satu baris.
 *    Fix: info surat (Nomor/Kepada/Dari/Tanggal/Perihal) sekarang satu
 *    <table> dengan 3 kolom (label, titik dua, isi) per baris — label dan
 *    isinya tidak akan pernah terpisah baris lagi.
 *
 * 3. "Dengan hormat," harus otomatis, bukan diketik manual di isian surat.
 *    Fix: sekarang tertanam langsung di template (teks tetap), pengisi
 *    surat cukup mengisi {isi} saja.
 *
 * 4. Blok tanda tangan ("Hormat kami, ... Kepala Bagian Personalia")
 *    menumpuk/tidak rapi karena pakai position:absolute di kontainer yang
 *    tingginya tidak pasti.
 *    Fix: sekarang pakai <table> biasa (alur dokumen normal, bukan
 *    position:absolute) — otomatis muncul rapi di kanan bawah SETELAH isi
 *    surat, tanpa risiko tumpang tindih.
 *
 * 5. Pratinjau (frontend) berantakan walau PDF rapi.
 *    Akar masalah: pratinjau me-render konten_html lewat
 *    dangerouslySetInnerHTML TANPA memuat CSS dari renderPDF.js sama sekali.
 *    Fix: seluruh styling sekarang inline per elemen (bukan class CSS), jadi
 *    hasilnya identik baik di Pratinjau maupun di PDF unduhan.
 *
 * Field yang dipakai template ini (harus cocok dengan yang dikirim
 * controller surat-keluar sebagai dataPdf — lihat src/modules/surat-keluar/
 * controller.js): nomor_surat, kepada, tanggal_surat, perihal, pic (field
 * tetap/kolom), ditambah data_dinamis apa pun dari template_field (isi,
 * dari, jabatan, dst).
 *
 * Cara pakai:
 *   node src/scripts/perbaiki-surat-final.js
 *
 * Aman dijalankan berkali-kali (idempotent) — konten_html lama (apa pun
 * isinya) selalu ditimpa habis dengan versi baru yang konsisten. Field
 * kustom (menimbang, keterangan, item_deskripsi, dst.) yang sudah ada di
 * template_field TETAP dipertahankan dan otomatis ditambahkan sebagai
 * paragraf baru sebelum blok tanda tangan.
 */
require('dotenv').config();
const db = require('../config/db');

// ============================================
// KOP SURAT — logo kiri, identitas perusahaan kanan, garis emas di bawah.
// Logo memakai placeholder {logo_perusahaan}, diisi otomatis oleh
// renderPDF.js dari file storage/public/logo.png. Pratinjau frontend TIDAK
// bisa mengisi placeholder ini (itu logika backend), jadi di pratinjau logo
// akan tampil kosong/alt-text — ini diharapkan dan tidak masalah, karena
// yang penting hasil PDF akhirnya benar. Layout teks lain di sekitarnya
// tetap identik di kedua tempat.
// ============================================
function kopSurat() {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 4px 0;">
  <tr>
    <td style="width:130px;vertical-align:middle;padding:0 16px 0 0;">
      <img src="{logo_perusahaan}" style="width:110px;height:auto;display:block;" alt="Logo PT Metanouva Informatika" />
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
// INFO SURAT — Nomor, Kepada, Dari, Tanggal, Perihal.
// Satu <table>, tiap baris = 1 <tr> dengan 3 kolom (label, ":", isi),
// jadi label dan isinya PASTI selalu satu baris, tidak akan pernah
// "Nomor" lalu ": ..." di baris berikutnya.
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
${baris('Dari', '{dari}')}
${baris('Tanggal', '{tanggal_surat}')}
${baris('Perihal', '{perihal}')}
</table>`;
}

// ============================================
// TANDA TANGAN — kanan bawah, alur dokumen normal (bukan position:absolute)
// supaya tidak pernah menumpuk dengan paragraf di atasnya, dan otomatis
// muncul SETELAH isi surat selesai.
// ============================================
function ttdSurat() {
  return `<table style="width:100%;border-collapse:collapse;margin-top:8px;">
  <tr>
    <td style="width:55%;">&nbsp;</td>
    <td style="width:45%;text-align:left;vertical-align:top;font-size:11pt;">
      <p style="margin:0 0 8px 0;font-weight:bold;">Hormat kami,</p>
      <div style="height:56px;">&nbsp;</div>
      <p style="margin:0;font-weight:bold;text-decoration:underline;">{pic}</p>
      <p style="margin:2px 0 0 0;">{jabatan}</p>
    </td>
  </tr>
</table>`;
}

// Field yang sudah dipakai eksplisit di kop/info/ttd — tidak perlu
// diulang lagi sebagai paragraf tambahan generik.
const FIELD_SUDAH_DIPAKAI = new Set(['isi', 'jabatan', 'dari', 'pic']);

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

      // Pastikan field 'dari' & 'jabatan' selalu tersedia supaya bisa diisi
      // lewat form (kalau sebelumnya cuma placeholder mentah yang tidak
      // pernah kosong-terisi).
      const tambahanField = [];
      if (!keys.includes('dari')) {
        tambahanField.push({
          template_id: t.id,
          field_key: 'dari',
          label: 'Dari',
          tipe: 'text',
          is_required: 0,
          urutan: 0,
        });
      }
      if (!keys.includes('jabatan')) {
        tambahanField.push({
          template_id: t.id,
          field_key: 'jabatan',
          label: 'Jabatan Penandatangan',
          tipe: 'text',
          is_required: 0,
          urutan: 99,
        });
      }
      if (tambahanField.length) {
        await db('template_field').insert(tambahanField);
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