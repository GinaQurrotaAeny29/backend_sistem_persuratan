const db = require('../config/db');

const generateNomorAgenda = async (tahun) => {
  return await db.transaction(async (trx) => {
    // Kunci baris counter
    let counter = await trx('counter')
      .where({ kunci: 'agenda_surat_masuk', tahun })
      .select('nomor_terakhir')
      .forUpdate()
      .first();

    let nomorBaru;
    if (!counter) {
      // Buat jika belum ada
      await trx('counter').insert({
        kunci: 'agenda_surat_masuk',
        tahun: tahun,
        nomor_terakhir: 0
      });
      nomorBaru = 1;
    } else {
      nomorBaru = counter.nomor_terakhir + 1;
    }

    // Update counter
    await trx('counter')
      .where({ kunci: 'agenda_surat_masuk', tahun })
      .update({ nomor_terakhir: nomorBaru });

    // Format: 0001/2026
    return `${String(nomorBaru).padStart(4, '0')}/${tahun}`;
  });
};

module.exports = generateNomorAgenda;