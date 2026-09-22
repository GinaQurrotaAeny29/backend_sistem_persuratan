const app = require('./app');
const { tutupBrowser } = require('./utils/renderPDF');
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`🚀 Backend berjalan di http://localhost:${port}`);
});

// Tutup browser Puppeteer saat server berhenti, supaya tidak ada proses menggantung
// yang membebani memori server.
const berhenti = async () => {
  console.log('Menutup server...');
  server.close();
  await tutupBrowser();
  process.exit(0);
};

process.on('SIGINT', berhenti);
process.on('SIGTERM', berhenti);