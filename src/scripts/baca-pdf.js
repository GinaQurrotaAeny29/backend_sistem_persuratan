const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function run() {
  const buf = fs.readFileSync('C:/Users/axel/AppData/Local/Temp/opencode/surat-pkl.pdf');
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  await parser.load();
  const text = await parser.getText();
  console.log(text.text);
  parser.destroy();
}

run().catch(e => console.error(e));
