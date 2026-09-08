exports.up = function(knex) {
  return knex.schema
    // 1. Users (tidak bergantung pada siapa pun)
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username', 50).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.enum('role', ['admin', 'pegawai']).notNullable();
      table.string('nama', 100).notNullable();
      table.enum('status', ['aktif', 'nonaktif']).defaultTo('aktif');
      table.timestamp('terakhir_masuk').nullable();
      table.timestamps(true, true);
    })
    // 2. Bagian (tidak bergantung pada siapa pun)
    .createTable('bagian', (table) => {
      table.increments('id').primary();
      table.string('kode', 10).unique().notNullable();
      table.string('nama', 100).notNullable();
      table.integer('urutan_tampil').defaultTo(0);
      table.enum('status', ['aktif', 'nonaktif']).defaultTo('aktif');
      table.timestamps(true, true);
    })
    // 3. Pegawai (bergantung pada users & bagian)
    .createTable('pegawai', (table) => {
      table.increments('id').primary();
      table.string('nama', 100).notNullable();
      table.string('nip', 50).nullable();
      table.string('jabatan', 100).nullable();
      table.integer('bagian_id').unsigned().nullable()
        .references('id').inTable('bagian').onDelete('SET NULL');
      table.integer('user_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.enum('status', ['aktif', 'nonaktif']).defaultTo('aktif');
      table.timestamps(true, true);
    })
    // 4. Jenis Surat (master, tidak bergantung pada siapa pun kecuali bagian opsional)
    .createTable('jenis_surat', (table) => {
      table.increments('id').primary();
      table.string('kode', 20).unique().notNullable();
      table.string('nama', 100).notNullable();
      table.integer('bagian_id').unsigned().nullable()
        .references('id').inTable('bagian').onDelete('SET NULL');
      table.enum('status', ['aktif', 'nonaktif']).defaultTo('aktif');
      table.timestamps(true, true);
    })
    // 5. Surat Masuk (bergantung pada users)
    .createTable('surat_masuk', (table) => {
      table.increments('id').primary();
      table.string('nomor_agenda', 20).unique().notNullable();
      table.string('nomor_surat', 100).notNullable();
      table.date('tanggal_surat').notNullable();
      table.text('perihal').notNullable();
      table.string('pengirim', 255).notNullable();
      table.string('pic', 100).nullable();
      table.text('keterangan').nullable();
      table.string('file_name', 255).nullable();
      table.string('file_path', 255).nullable();
      table.integer('file_size').nullable();
      table.integer('dibuat_oleh').unsigned().notNullable()
        .references('id').inTable('users');
      table.timestamps(true, true);
      table.timestamp('deleted_at').nullable();
    })
    // 6. Disposisi (bergantung pada surat_masuk & pegawai)
    .createTable('disposisi', (table) => {
      table.increments('id').primary();
      table.integer('surat_masuk_id').unsigned().notNullable()
        .references('id').inTable('surat_masuk').onDelete('CASCADE');
      table.integer('dari_pegawai_id').unsigned().notNullable()
        .references('id').inTable('pegawai');
      table.integer('kepada_pegawai_id').unsigned().notNullable()
        .references('id').inTable('pegawai');
      table.text('instruksi').notNullable();
      table.date('batas_waktu').nullable();
      table.enum('status', ['belum_dibaca', 'diproses', 'selesai']).defaultTo('belum_dibaca');
      table.text('hasil_tindak_lanjut').nullable();
      table.timestamp('dibaca_pada').nullable();
      table.timestamp('selesai_pada').nullable();
      table.timestamps(true, true);
    })
    // 7. Riwayat Disposisi (bergantung pada disposisi & users)
    .createTable('riwayat_disposisi', (table) => {
      table.increments('id').primary();
      table.integer('disposisi_id').unsigned().notNullable()
        .references('id').inTable('disposisi').onDelete('CASCADE');
      table.integer('aktor_id').unsigned().notNullable()
        .references('id').inTable('users');
      table.enum('status_lama', ['belum_dibaca', 'diproses', 'selesai']).nullable();
      table.enum('status_baru', ['belum_dibaca', 'diproses', 'selesai']).nullable();
      table.text('catatan').nullable();
      table.timestamp('waktu').defaultTo(knex.fn.now());
    })
    // 8. Template Surat (bergantung pada jenis_surat)
    .createTable('template_surat', (table) => {
      table.increments('id').primary();
      table.string('nama', 100).notNullable();
      table.integer('jenis_surat_id').unsigned().nullable()
        .references('id').inTable('jenis_surat').onDelete('SET NULL');
      table.text('konten_html').notNullable();
      table.string('format_nomor', 255).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    // 9. Field Dinamis Template (bergantung pada template_surat)
    .createTable('template_field', (table) => {
      table.increments('id').primary();
      table.integer('template_id').unsigned().notNullable()
        .references('id').inTable('template_surat').onDelete('CASCADE');
      table.string('field_key', 50).notNullable();
      table.string('label', 100).notNullable();
      table.enum('tipe', ['text', 'textarea', 'date', 'number', 'select']).notNullable();
      table.boolean('is_required').defaultTo(false);
      table.text('nilai_bawaan').nullable();
      table.integer('urutan').defaultTo(0);
      table.json('opsi').nullable();
      table.timestamps(true, true);
    })
    // 10. Surat Keluar (bergantung pada banyak tabel)
    .createTable('surat_keluar', (table) => {
      table.increments('id').primary();
      table.integer('nomor_urut').notNullable();
      table.integer('tahun').notNullable();
      table.string('nomor_surat', 100).unique().notNullable();
      table.date('tanggal_surat').notNullable();
      table.string('kepada', 255).notNullable();
      table.text('perihal').notNullable();
      table.string('pic', 100).nullable();
      table.integer('bagian_id').unsigned().nullable()
        .references('id').inTable('bagian').onDelete('SET NULL');
      table.integer('jenis_surat_id').unsigned().nullable()
        .references('id').inTable('jenis_surat').onDelete('SET NULL');
      table.integer('template_id').unsigned().nullable()
        .references('id').inTable('template_surat').onDelete('SET NULL');
      table.integer('membalas_surat_masuk_id').unsigned().nullable()
        .references('id').inTable('surat_masuk').onDelete('SET NULL');
      table.json('data_dinamis').nullable();
      table.string('file_path', 255).nullable();
      table.integer('dibuat_oleh').unsigned().notNullable()
        .references('id').inTable('users');
      table.timestamps(true, true);
      table.unique(['tahun', 'nomor_urut']);
    })
    // 11. Notifikasi (bergantung pada pegawai)
    .createTable('notifikasi', (table) => {
      table.increments('id').primary();
      table.integer('pegawai_id').unsigned().notNullable()
        .references('id').inTable('pegawai').onDelete('CASCADE');
      table.enum('jenis', ['surat_masuk_baru', 'disposisi_baru', 'disposisi_selesai', 'batas_waktu_dekat', 'nomor_surat_keluar']).notNullable();
      table.string('judul', 255).notNullable();
      table.string('keterangan', 255).nullable();
      table.string('tautan_tipe', 50).nullable();
      table.integer('tautan_id').nullable();
      table.boolean('dibaca').defaultTo(false);
      table.timestamp('dibaca_pada').nullable();
      table.timestamp('waktu').defaultTo(knex.fn.now());
    })
    // 12. Counter (tidak bergantung pada siapa pun)
    .createTable('counter', (table) => {
      table.string('kunci', 50).primary();
      table.integer('tahun').notNullable();
      table.integer('nomor_terakhir').defaultTo(0);
      table.timestamps(true, true);
      table.unique(['kunci', 'tahun']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('counter')
    .dropTableIfExists('notifikasi')
    .dropTableIfExists('surat_keluar')
    .dropTableIfExists('template_field')
    .dropTableIfExists('template_surat')
    .dropTableIfExists('riwayat_disposisi')
    .dropTableIfExists('disposisi')
    .dropTableIfExists('surat_masuk')
    .dropTableIfExists('jenis_surat')
    .dropTableIfExists('pegawai')
    .dropTableIfExists('bagian')
    .dropTableIfExists('users');
};