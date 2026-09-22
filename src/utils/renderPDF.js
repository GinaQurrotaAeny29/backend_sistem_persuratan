const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ============================================
// Logo perusahaan — dibaca LANGSUNG dari file asli setiap kali dibutuhkan
// (di-cache setelah pembacaan pertama), BUKAN dari string base64 yang
// ditempel manual di source code.
//
// FIX PENTING: sebelumnya logo disimpan sebagai string base64 hardcode di
// sini, tapi string-nya ternyata TERPOTONG (corrupt) — cuma ~1.5KB padahal
// file logo.png aslinya ~12.7KB. PNG yang terpotong tetap py bisa dikenali
// sebagai PNG (header di awal file masih valid) tapi data gambarnya
// tidak lengkap, sehingga browser cuma sanggup menggambar sepotong kecil
// baris atas gambar → itulah sebabnya logo "cuma muncul sedikit" di PDF.
// Membaca langsung dari file menghindari risiko ini terulang lagi.
// ============================================
const LOGO_PATH = path.join(__dirname, '../../storage/public/logo.png');
let logoDataUriCache = null;

const getLogoDataUri = () => {
  if (logoDataUriCache) return logoDataUriCache;
  try {
    const buf = fs.readFileSync(LOGO_PATH);
    logoDataUriCache = `data:image/png;base64,${buf.toString('base64')}`;
  } catch (err) {
    console.warn('Logo tidak ditemukan di', LOGO_PATH, '-', err.message);
    logoDataUriCache = '';
  }
  return logoDataUriCache;
};

let browserInstance = null;
let idleTimer = null;

// Browser ditutup otomatis bila tidak dipakai selama menit ini (mencegah RAM membengkak)
const IDLE_BATAS_MS = 5 * 60 * 1000; // 5 menit

const mulaiTimerIdle = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch (err) {
        console.error('Gagal menutup browser saat idle:', err.message);
      }
      browserInstance = null;
    }
  }, IDLE_BATAS_MS);
  idleTimer.unref && idleTimer.unref();
};

// ============================================
// Ambil instance browser (lazy init)
// ============================================
const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  mulaiTimerIdle();
  return browserInstance;
};

// Tutup browser sepenuhnya (dipanggil saat server berhenti)
const tutupBrowser = async () => {
  clearTimeout(idleTimer);
  if (browserInstance) {
    try {
      await browserInstance.close();
    } finally {
      browserInstance = null;
    }
  }
};

// ============================================
// Isi konten_html dengan data_dinamis
// Placeholder: {nama_field} → value
// ============================================
const isiTemplate = (kontenHtml, data) => {
  if (!kontenHtml) return '';
  return kontenHtml.replace(/\{([a-z_][a-z0-9_]*)\}/gi, (match, key) => {
    const value = data[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
};

// ============================================
// Render HTML → PDF, simpan ke storage/surat-keluar/
// Template konten_html sudah berisi kop-surat, isi, ttd lengkap
// ============================================
const renderPDF = async (kontenHtml, dataDinamis, namaFile) => {
  try {
    // Logo disisipkan otomatis lewat placeholder {logo_perusahaan} — template
    // tidak perlu (dan sebaiknya tidak) menyimpan base64 logo sendiri.
    const dataLengkap = { ...dataDinamis, logo_perusahaan: getLogoDataUri() };
    const html = isiTemplate(kontenHtml, dataLengkap);

    // Bungkus dengan HTML minimal + style - template sudah lengkap
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 2.5cm 2cm 2.5cm 2cm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            margin: 0;
            /* Sama seperti .prose-surat di frontend (src/index.css) — teks
               isi surat yang panjang tanpa spasi (satu "kata" panjang,
               tautan, dst) harus patah mengikuti lebar halaman, bukan
               melebar ke luar margin PDF. Tanpa ini, Pratinjau dan PDF
               unduhan bisa terlihat berbeda untuk isi surat yang sama. */
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          img { max-width: 100%; }
          table { border-collapse: collapse; }
          td { overflow-wrap: anywhere; word-break: break-word; }
          /* Cegah baris/kata pertama-terakhir paragraf terpisah sendirian di halaman lain */
          p { orphans: 3; widows: 3; }

          /*
            CATATAN: template surat (konten_html, disimpan di database lewat
            Data Master Template) SENGAJA memakai inline style di setiap
            elemen, bukan class CSS di sini. Alasannya: halaman Pratinjau di
            frontend (SuratKeluarBaruPage.tsx) menampilkan konten_html apa
            adanya lewat dangerouslySetInnerHTML TANPA memuat stylesheet ini
            sama sekali — jadi kalau tata letak surat bergantung ke class CSS
            yang cuma didefinisikan di sini, hasilnya akan SELALU berantakan
            di Pratinjau meskipun PDF unduhannya rapi. Dengan inline style,
            tampilan Pratinjau dan PDF hasil unduhan konsisten satu sama lain.
            Jangan tambahkan class CSS baru di sini untuk tata letak surat —
            taruh langsung sebagai inline style di konten_html templatenya.
          */
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const storageDir = path.join(__dirname, '../../storage/surat-keluar');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const filePath = path.join(storageDir, namaFile);

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }
      });
    } finally {
      // Pastikan halaman selalu ditutup meski render gagal — mencegah kebocoran memori.
      await page.close().catch((err) => console.error('Gagal menutup halaman:', err.message));
    }

    return filePath;
  } catch (error) {
    console.error('Error renderPDF:', error);
    throw error;
  }
};

module.exports = { renderPDF, isiTemplate, tutupBrowser };