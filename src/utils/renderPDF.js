const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

let browserInstance = null;

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
  return browserInstance;
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
// ============================================
const renderPDF = async (kontenHtml, dataDinamis, namaFile) => {
  try {
    const html = isiTemplate(kontenHtml, dataDinamis);

    // Bungkus dengan HTML lengkap + style dasar
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
          h1 { font-size: 16pt; text-align: center; }
          .kop { border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;

    const storageDir = path.join(__dirname, '../../storage/surat-keluar');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const filePath = path.join(storageDir, namaFile);

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }
    });
    await page.close();

    return filePath;
  } catch (error) {
    console.error('Error renderPDF:', error);
    throw error;
  }
};

module.exports = { renderPDF, isiTemplate };