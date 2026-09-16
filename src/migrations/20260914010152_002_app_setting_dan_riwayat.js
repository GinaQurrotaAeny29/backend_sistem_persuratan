exports.up = function (knex) {
  return knex.schema
    // 1. app_setting — key-value pengaturan aplikasi
    .createTable('app_setting', (table) => {
      table.string('kunci', 50).primary();
      table.text('nilai').notNullable();
      table.string('deskripsi', 255).nullable();
      table.timestamps(true, true);
    })
    // 2. riwayat_penomoran — catatan perubahan aturan penomoran
    .createTable('riwayat_penomoran', (table) => {
      table.increments('id').primary();
      table.integer('aktor_id').unsigned().notNullable()
        .references('id').inTable('users');
      table.string('field', 50).notNullable(); // 'kode_perusahaan', 'format_nomor', dst
      table.text('nilai_lama').nullable();
      table.text('nilai_baru').nullable();
      table.timestamp('waktu').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('riwayat_penomoran')
    .dropTableIfExists('app_setting');
};