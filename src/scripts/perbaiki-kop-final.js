/**
 * Perbaikan final untuk kop-surat semua template.
 *
 * Masalah yang diperbaiki:
 * 1. Logo tampil rusak (cuma alt text) — karena <img> lama rujuk ke base64
 *    yang sudah cacat/terpotong di database. Diganti dengan base64 baru yang
 *    dijamin utuh (persis sama dengan yang dipakai renderPDF.js).
 * 2. Nama & alamat perusahaan muncul DOBEL — karena versi lama menyimpan dua
 *    blok kop sekaligus (kop-header-line + kop-nama-perusahaan/kop-alamat).
 *    Diganti jadi satu blok kop saja.
 * 3. Kop dibuat pakai <table> dengan INLINE STYLE (bukan class CSS seperti
 *    .kop-surat/.kop-logo). Ini penting: halaman Pratinjau di frontend
 *    (SuratKeluarBaruPage.tsx) me-render konten_html apa adanya lewat
 *    dangerouslySetInnerHTML TANPA memuat stylesheet dari renderPDF.js.
 *    Jadi kalau kopnya masih bergantung ke class CSS, di frontend akan
 *    selalu tampil polos/berantakan meski di PDF sudah rapi. Dengan inline
 *    style, tampilannya konsisten baik di Pratinjau (frontend) maupun di
 *    PDF hasil unduhan (backend).
 *
 * Cara pakai:
 *   node src/scripts/perbaiki-kop-final.js
 *
 * Aman dijalankan berkali-kali (idempotent) — setiap kali dijalankan, kop
 * lama (apa pun isinya) selalu dibuang habis dan diganti yang baru.
 */
require('dotenv').config();
const db = require('../config/db');

// Base64 logo — SAMA PERSIS dengan LOGO_BASE64 di src/utils/renderPDF.js.
// Kalau logo resmi kamu berubah, update juga di kedua tempat ini.
const LOGO_BASE64 = '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';

// Kop satu-satunya sumber kebenaran: logo kiri, PT. Metanouva Informatika
// kanan, garis emas di bawah — SEMUA inline style, tidak bergantung class CSS.
function kopSurat() {
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
  <tr>
    <td style="width:100px;vertical-align:middle;padding-right:16px;">
      <img src="data:image/png;base64,${LOGO_BASE64}" style="width:65px;height:auto;display:block;" alt="Logo PT Metanouva Informatika" />
    </td>
    <td style="vertical-align:middle;text-align:right;">
      <p style="font-size:16pt;font-weight:bold;color:#3D2312;margin:0 0 4px 0;letter-spacing:0.5px;">PT. METANOUVA INFORMATIKA</p>
      <p style="font-size:9pt;margin:0;color:#333;">Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Pasirkaliki,</p>
      <p style="font-size:9pt;margin:0;color:#333;">Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>
      <p style="font-size:9pt;margin:2px 0 0 0;color:#333;">info@digitak.id&nbsp;&nbsp;|&nbsp;&nbsp;digitak.id</p>
    </td>
  </tr>
</table>
<hr style="border:none;border-top:3px solid #D27A0F;margin:12px 0 18px 0;" />
`;
}

// Buang blok kop lama (apa pun isinya: rusak, dobel, dll) dan sisakan mulai
// dari kata "Nomor" — semua template (baik yang dibuat lewat perbaiki-template.js,
// update-template.js, maupun demo_data.js) selalu mulai isi suratnya dengan kata
// "Nomor" tepat setelah kop, jadi ini titik potong yang aman dipakai di semua kasus.
function buangKopLama(html) {
  const idx = html.indexOf('Nomor');
  if (idx === -1) {
    // Tidak ketemu penanda "Nomor" — jangan buang apa pun, cuma kasih tahu.
    return { html, terpotong: false };
  }
  return { html: html.slice(idx), terpotong: true };
}

async function run() {
  try {
    const templates = await db('template_surat').select('id', 'nama', 'konten_html');

    let diperbaiki = 0;
    let dilewati = 0;

    for (const t of templates) {
      const { html: sisaHtml, terpotong } = buangKopLama(t.konten_html || '');

      if (!terpotong) {
        console.warn(`[LEWAT] Template #${t.id} (${t.nama}) — tidak ketemu penanda "Nomor", dicek manual.`);
        dilewati++;
        continue;
      }

      const htmlBaru = kopSurat() + sisaHtml;

      await db('template_surat').where({ id: t.id }).update({ konten_html: htmlBaru });
      diperbaiki++;
      console.log(`[OK] Template #${t.id} (${t.nama}) — kop dibersihkan & diganti.`);
    }

    console.log(`\n[SELESAI] ${diperbaiki} template diperbaiki, ${dilewati} dilewati (cek manual).`);
    process.exit(0);
  } catch (err) {
    console.error('Gagal menjalankan perbaikan:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();