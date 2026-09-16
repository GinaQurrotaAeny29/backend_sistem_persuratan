exports.up = function (knex) {
  return knex.schema
    .alterTable('surat_keluar', (table) => {
      // 1. Ubah nomor_urut jadi nullable (untuk surat lama yang tidak pakai counter)
      table.integer('nomor_urut').nullable().alter();

      // 2. Tambah jenis_input: 'baru' (generate sistem) atau 'lama' (input manual)
      table.enum('jenis_input', ['baru', 'lama']).defaultTo('baru');

      // 3. Tambah nomor_surat_manual untuk surat lama
      table.string('nomor_surat_manual', 100).nullable();

      // 4. Tambah keterangan (opsional)
      table.text('keterangan').nullable();
    });
};

exports.down = function (knex) {
  return knex.schema.alterTable('surat_keluar', (table) => {
    table.dropColumn('jenis_input');
    table.dropColumn('nomor_surat_manual');
    table.dropColumn('keterangan');
    table.integer('nomor_urut').notNullable().alter();
  });
};