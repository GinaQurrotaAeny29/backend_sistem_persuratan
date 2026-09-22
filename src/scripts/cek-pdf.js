require('dotenv').config();
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function run() {
  const data = fs.readFileSync('C:/Users/axel/AppData/Local/Temp/opencode/final-test.pdf');
  const parser = new PDFParse({ data: new Uint8Array(data) });
  await parser.load();
  const t = await parser.getText();
  const lines = t.text.split('\n');
  console.log(lines.slice(0, 15).join('\n'));
  console.log('\n--- HAS PT METANOUVA ---', t.text.includes('PT METANOUVA INFORMATIKA'));
  console.log('--- HAS NOMOR SURAT ---', t.text.includes('019/DIR.01/Digitak/IX/2026'));
  process.exit(0);
}
run();