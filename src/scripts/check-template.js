require('dotenv').config();
const db = require('../config/db');

async function run() {
  const t = await db('template_surat').where({ id: 5 }).first();
  const html = t.konten_html;
  const hasBullet = html.includes('&bull;');
  const hasHr = html.includes('<hr');
  console.log('has &bull;:', hasBullet);
  console.log('has <hr>:', hasHr);
  const hrIdx = html.indexOf('<hr');
  console.log('hr snippet:', html.substring(hrIdx, hrIdx + 120));
  process.exit(0);
}
run();
