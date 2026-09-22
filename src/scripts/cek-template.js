require('dotenv').config();
const db = require('../config/db');

async function run() {
  const t = await db('template_surat').where({ id: 5 }).first();
  const html = t.konten_html;
  // hapus data-uri logo agar tidak berisik
  const bersih = html.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, '[LOGO]');
  console.log(bersih);
  console.log('\n--- nomor_surat ada:', bersih.includes('{nomor_surat}'), '---');
  process.exit(0);
}
run();
