exports.seed = async function (knex) {
  // Hapus data lama
  await knex('app_setting').del();

  // Data default
  await knex('app_setting').insert([
    {
      kunci: 'format_nomor',
      nilai: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
      deskripsi: 'Format penomoran surat keluar',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      kunci: 'kode_perusahaan',
      nilai: 'Digitak',
      deskripsi: 'Kode perusahaan yang tampil di nomor surat',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      kunci: 'panjang_nomor_urut',
      nilai: '3',
      deskripsi: 'Jumlah digit nomor urut (3 = 001, 002)',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      kunci: 'cakupan_penomoran',
      nilai: 'global_per_tahun',
      deskripsi: 'Cakupan counter: global_per_tahun | per_bagian',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};