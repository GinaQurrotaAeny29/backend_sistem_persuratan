const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Hapus data lama (urutan reverse dari ketergantungan)
  await knex('notifikasi').del();
  await knex('riwayat_disposisi').del();
  await knex('disposisi').del();
  await knex('surat_keluar').del();
  await knex('template_field').del();
  await knex('template_surat').del();
  await knex('surat_masuk').del();
  await knex('pegawai').del();
  await knex('jenis_surat').del();
  await knex('bagian').del();
  await knex('users').del();
  await knex('counter').del();

  // Hash password
  const adminPass = await bcrypt.hash('admin123', 10);
  const pegawaiPass = await bcrypt.hash('pegawai123', 10);

  // 1. Insert users
  const [adminId] = await knex('users').insert({
    username: 'rina.marlina',
    password_hash: adminPass,
    role: 'admin',
    nama: 'Rina Marlina',
    status: 'aktif',
    created_at: new Date(),
    updated_at: new Date()
  });

  const [pegawaiUserId] = await knex('users').insert({
    username: 'budi.santoso',
    password_hash: pegawaiPass,
    role: 'pegawai',
    nama: 'Budi Santoso',
    status: 'aktif',
    created_at: new Date(),
    updated_at: new Date()
  });

  // 2. Insert bagian
  const [bagianId] = await knex('bagian').insert({
    kode: 'FIN',
    nama: 'Keuangan',
    urutan_tampil: 1,
    status: 'aktif',
    created_at: new Date(),
    updated_at: new Date()
  });

  // 3. Insert jenis surat
  const [jenisId] = await knex('jenis_surat').insert({
    kode: 'FIN.03',
    nama: 'Invoice',
    bagian_id: bagianId,
    status: 'aktif',
    created_at: new Date(),
    updated_at: new Date()
  });

  // 4. Insert pegawai
  await knex('pegawai').insert([
    {
      nama: 'Rina Marlina',
      nip: 'ADM001',
      jabatan: 'Kepala Administrasi',
      bagian_id: bagianId,
      user_id: adminId,
      status: 'aktif',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      nama: 'Budi Santoso',
      nip: 'FIN002',
      jabatan: 'Staf Keuangan',
      bagian_id: bagianId,
      user_id: pegawaiUserId,
      status: 'aktif',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      nama: 'Siti Rahayu',
      nip: 'FIN003',
      jabatan: 'Staf Keuangan',
      bagian_id: bagianId,
      user_id: null,
      status: 'aktif',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // 5. Insert counter
  await knex('counter').insert([
    { kunci: 'agenda_surat_masuk', tahun: 2026, nomor_terakhir: 0 },
    { kunci: 'nomor_surat_keluar', tahun: 2026, nomor_terakhir: 0 }
  ]);
};