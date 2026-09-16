// ============================================
// Seed Demo Data — 03_demo_data.js
// Sifat: append-only (tidak hapus data lama)
// Isi: 5 bagian baru, 11 jenis surat, 4 template + 12 field,
//      2 surat masuk, 2 disposisi + riwayat + notifikasi, 3 surat keluar
// ============================================

exports.seed = async function (knex) {
  // Cek apakah sudah pernah di-seed
  const existingDIR = await knex('bagian').where({ kode: 'DIR' }).first();
  if (existingDIR) {
    console.log('⚠️ Demo data sudah ada. Skip seed 03.');
    return;
  }

  const tahunBerjalan = new Date().getFullYear();
  const now = new Date();

  // ============================================
  // 1. Tambah 5 bagian baru (FIN sudah ada dari seeder 01)
  // ============================================
  await knex('bagian').insert([
    { kode: 'DIR', nama: 'Direksi', urutan_tampil: 2, status: 'aktif', created_at: now, updated_at: now },
    { kode: 'HR', nama: 'Personalia', urutan_tampil: 3, status: 'aktif', created_at: now, updated_at: now },
    { kode: 'ADM', nama: 'Administrasi', urutan_tampil: 4, status: 'aktif', created_at: now, updated_at: now },
    { kode: 'MKT', nama: 'Marketing', urutan_tampil: 5, status: 'aktif', created_at: now, updated_at: now },
    { kode: 'ENG', nama: 'Engineering', urutan_tampil: 6, status: 'aktif', created_at: now, updated_at: now }
  ]);

  const bagianMap = {};
  const allBagian = await knex('bagian').select('id', 'kode');
  allBagian.forEach((b) => { bagianMap[b.kode] = b.id; });

  // ============================================
  // 2. Jenis surat per bagian
  // ============================================
  await knex('jenis_surat').insert([
    { kode: 'DIR.01', nama: 'Surat Keputusan', bagian_id: bagianMap['DIR'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'DIR.02', nama: 'Surat Pemberitahuan', bagian_id: bagianMap['DIR'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'DIR.03', nama: 'Surat Edaran', bagian_id: bagianMap['DIR'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'HR.01', nama: 'Surat Pengangkatan', bagian_id: bagianMap['HR'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'HR.02', nama: 'Surat Peringatan', bagian_id: bagianMap['HR'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'HR.03', nama: 'Surat Cuti', bagian_id: bagianMap['HR'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'ADM.01', nama: 'Surat Tugas', bagian_id: bagianMap['ADM'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'ADM.02', nama: 'Surat Undangan', bagian_id: bagianMap['ADM'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'MKT.01', nama: 'Surat Penawaran', bagian_id: bagianMap['MKT'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'MKT.02', nama: 'Surat Perjanjian Kerjasama', bagian_id: bagianMap['MKT'], status: 'aktif', created_at: now, updated_at: now },
    { kode: 'ENG.01', nama: 'Surat Perintah Kerja', bagian_id: bagianMap['ENG'], status: 'aktif', created_at: now, updated_at: now }
  ]);

  const jenisMap = {};
  const allJenis = await knex('jenis_surat').select('id', 'kode');
  allJenis.forEach((j) => { jenisMap[j.kode] = j.id; });

  // ============================================
  // 3. Ambil user & pegawai yang sudah ada
  // ============================================
  const adminUser = await knex('users').where({ username: 'rina.marlina' }).first();
  const adminPegawai = await knex('pegawai').where({ user_id: adminUser.id }).first();
  const budiUser = await knex('users').where({ username: 'budi.santoso' }).first();
  const budiPegawai = await knex('pegawai').where({ user_id: budiUser.id }).first();

  // ============================================
  // 4. Template + field per jenis
  // ============================================
  await knex('template_surat').insert([
    {
      nama: 'Surat Keputusan Standar',
      jenis_surat_id: jenisMap['DIR.01'],
      konten_html: '<div class="kop"><h1>SURAT KEPUTUSAN DIREKSI</h1></div><p>Nomor: {nomor_surat}</p><p>Tentang: {tentang}</p><p>Menimbang: {menimbang}</p><p>Memutuskan: {memutuskan}</p>',
      format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
      is_active: true,
      created_at: now, updated_at: now
    },
    {
      nama: 'Surat Pemberitahuan Standar',
      jenis_surat_id: jenisMap['DIR.02'],
      konten_html: '<div class="kop"><h1>SURAT PEMBERITAHUAN</h1></div><p>Kepada: {kepada}</p><p>Dengan hormat, kami beritahukan bahwa: {isi}</p>',
      format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
      is_active: true,
      created_at: now, updated_at: now
    },
    {
      nama: 'Surat Tugas Standar',
      jenis_surat_id: jenisMap['ADM.01'],
      konten_html: '<div class="kop"><h1>SURAT TUGAS</h1></div><p>Yang bertanda tangan di bawah ini menugaskan:</p><p>Nama: {nama_petugas}</p><p>Untuk: {tugas}</p><p>Tanggal: {tanggal_tugas}</p>',
      format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
      is_active: true,
      created_at: now, updated_at: now
    },
    {
      nama: 'Surat Penawaran Standar',
      jenis_surat_id: jenisMap['MKT.01'],
      konten_html: '<div class="kop"><h1>SURAT PENAWARAN</h1></div><p>Kepada: {kepada}</p><p>Kami menawarkan: {produk}</p><p>Harga: Rp {harga}</p><p>Berlaku hingga: {berlaku_hingga}</p>',
      format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
      is_active: true,
      created_at: now, updated_at: now
    }
  ]);

  const allTemplates = await knex('template_surat').select('id', 'nama');
  const templateMap = {};
  allTemplates.forEach((t) => { templateMap[t.nama] = t.id; });

  await knex('template_field').insert([
    { template_id: templateMap['Surat Keputusan Standar'], field_key: 'tentang', label: 'Tentang', tipe: 'text', is_required: 1, nilai_bawaan: null, urutan: 1, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Keputusan Standar'], field_key: 'menimbang', label: 'Menimbang', tipe: 'textarea', is_required: 1, nilai_bawaan: null, urutan: 2, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Keputusan Standar'], field_key: 'memutuskan', label: 'Memutuskan', tipe: 'textarea', is_required: 1, nilai_bawaan: null, urutan: 3, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Pemberitahuan Standar'], field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: 1, nilai_bawaan: null, urutan: 1, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Pemberitahuan Standar'], field_key: 'isi', label: 'Isi Pemberitahuan', tipe: 'textarea', is_required: 1, nilai_bawaan: null, urutan: 2, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Tugas Standar'], field_key: 'nama_petugas', label: 'Nama Petugas', tipe: 'text', is_required: 1, nilai_bawaan: null, urutan: 1, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Tugas Standar'], field_key: 'tugas', label: 'Tugas', tipe: 'textarea', is_required: 1, nilai_bawaan: null, urutan: 2, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Tugas Standar'], field_key: 'tanggal_tugas', label: 'Tanggal Tugas', tipe: 'date', is_required: 1, nilai_bawaan: null, urutan: 3, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Penawaran Standar'], field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: 1, nilai_bawaan: null, urutan: 1, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Penawaran Standar'], field_key: 'produk', label: 'Produk', tipe: 'text', is_required: 1, nilai_bawaan: null, urutan: 2, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Penawaran Standar'], field_key: 'harga', label: 'Harga', tipe: 'number', is_required: 1, nilai_bawaan: null, urutan: 3, opsi: null, created_at: now, updated_at: now },
    { template_id: templateMap['Surat Penawaran Standar'], field_key: 'berlaku_hingga', label: 'Berlaku Hingga', tipe: 'date', is_required: 0, nilai_bawaan: null, urutan: 4, opsi: null, created_at: now, updated_at: now }
  ]);

  // ============================================
  // 5. Surat masuk contoh + update counter agenda
  // ============================================
  let counterAgenda = await knex('counter')
    .where({ kunci: 'agenda_surat_masuk', tahun: tahunBerjalan })
    .first();

  if (!counterAgenda) {
    await knex('counter').insert({
      kunci: 'agenda_surat_masuk',
      tahun: tahunBerjalan,
      nomor_terakhir: 0,
      created_at: now, updated_at: now
    });
    counterAgenda = { nomor_terakhir: 0 };
  }

  let agendaTerakhir = counterAgenda.nomor_terakhir;
  const agenda1 = `${String(agendaTerakhir + 1).padStart(4, '0')}/${tahunBerjalan}`;
  const agenda2 = `${String(agendaTerakhir + 2).padStart(4, '0')}/${tahunBerjalan}`;

  await knex('surat_masuk').insert([
    {
      nomor_agenda: agenda1,
      nomor_surat: '010/EXT/ITG/IX/2026',
      tanggal_surat: '2026-09-10',
      pengirim: 'Institut Teknologi Garut',
      perihal: 'Permohonan Kerja Praktik',
      pic: 'Seno Prianto',
      keterangan: null,
      file_name: null, file_path: null, file_size: null,
      dibuat_oleh: adminUser.id,
      created_at: now, updated_at: now
    },
    {
      nomor_agenda: agenda2,
      nomor_surat: '011/EXT/DISDIK/IX/2026',
      tanggal_surat: '2026-09-12',
      pengirim: 'Dinas Pendidikan',
      perihal: 'Undangan Rapat Koordinasi',
      pic: 'Ahmad Abdullah',
      keterangan: null,
      file_name: null, file_path: null, file_size: null,
      dibuat_oleh: adminUser.id,
      created_at: now, updated_at: now
    }
  ]);

  agendaTerakhir += 2;
  await knex('counter')
    .where({ kunci: 'agenda_surat_masuk', tahun: tahunBerjalan })
    .update({ nomor_terakhir: agendaTerakhir, updated_at: now });

  const suratMasuk1 = await knex('surat_masuk').where({ nomor_surat: '010/EXT/ITG/IX/2026' }).first();
  const suratMasuk2 = await knex('surat_masuk').where({ nomor_surat: '011/EXT/DISDIK/IX/2026' }).first();

  // ============================================
  // 6. Disposisi + riwayat + notifikasi
  // ============================================
  const [disposisiId1] = await knex('disposisi').insert({
    surat_masuk_id: suratMasuk1.id,
    dari_pegawai_id: adminPegawai.id,
    kepada_pegawai_id: budiPegawai.id,
    instruksi: 'Mohon ditindaklanjuti dan disiapkan surat balasan',
    batas_waktu: '2026-09-30',
    status: 'belum_dibaca',
    hasil_tindak_lanjut: null,
    dibaca_pada: null,
    selesai_pada: null,
    created_at: now, updated_at: now
  });

  const [disposisiId2] = await knex('disposisi').insert({
    surat_masuk_id: suratMasuk2.id,
    dari_pegawai_id: adminPegawai.id,
    kepada_pegawai_id: budiPegawai.id,
    instruksi: 'Mohon dikonfirmasi kehadiran dan disiapkan materi',
    batas_waktu: '2026-09-25',
    status: 'diproses',
    hasil_tindak_lanjut: null,
    dibaca_pada: now,
    selesai_pada: null,
    created_at: now, updated_at: now
  });

  await knex('riwayat_disposisi').insert([
    {
      disposisi_id: disposisiId1,
      aktor_id: adminUser.id,
      status_lama: null,
      status_baru: 'belum_dibaca',
      catatan: 'Disposisi dibuat',
      waktu: now
    },
    {
      disposisi_id: disposisiId2,
      aktor_id: adminUser.id,
      status_lama: null,
      status_baru: 'belum_dibaca',
      catatan: 'Disposisi dibuat',
      waktu: now
    },
    {
      disposisi_id: disposisiId2,
      aktor_id: budiUser.id,
      status_lama: 'belum_dibaca',
      status_baru: 'diproses',
      catatan: 'Disposisi dibaca',
      waktu: now
    }
  ]);

  await knex('notifikasi').insert([
    {
      pegawai_id: budiPegawai.id,
      jenis: 'disposisi_baru',
      judul: 'Disposisi Baru dari Rina Marlina',
      keterangan: 'Permohonan Kerja Praktik dari Institut Teknologi Garut',
      tautan_tipe: 'disposisi',
      tautan_id: disposisiId1,
      dibaca: false,
      dibaca_pada: null,
      waktu: now
    },
    {
      pegawai_id: budiPegawai.id,
      jenis: 'disposisi_baru',
      judul: 'Disposisi Baru dari Rina Marlina',
      keterangan: 'Undangan Rapat Koordinasi dari Dinas Pendidikan',
      tautan_tipe: 'disposisi',
      tautan_id: disposisiId2,
      dibaca: true,
      dibaca_pada: now,
      waktu: now
    }
  ]);

  // ============================================
  // 7. Surat keluar contoh + update counter
  // ============================================
  let counterSurat = await knex('counter')
    .where({ kunci: 'nomor_surat_keluar', tahun: tahunBerjalan })
    .first();

  if (!counterSurat) {
    await knex('counter').insert({
      kunci: 'nomor_surat_keluar',
      tahun: tahunBerjalan,
      nomor_terakhir: 0,
      created_at: now, updated_at: now
    });
    counterSurat = { nomor_terakhir: 0 };
  }

  let suratTerakhir = counterSurat.nomor_terakhir;
  const fin03Id = jenisMap['FIN.03'] || null;

  const suratKeluarData = [];
  for (let i = 1; i <= 3; i++) {
    const nomorUrut = suratTerakhir + i;
    const nomorSurat = `${String(nomorUrut).padStart(3, '0')}/FIN.03/Digitak/IX/${tahunBerjalan}`;
    suratKeluarData.push({
      nomor_urut: nomorUrut,
      tahun: tahunBerjalan,
      nomor_surat: nomorSurat,
      nomor_surat_manual: null,
      jenis_input: 'baru',
      tanggal_surat: '2026-09-15',
      kepada: i === 1 ? 'Institut Teknologi Garut' : `PT Contoh ${i}`,
      perihal: i === 1 ? 'Balasan Permohonan Kerja Praktik' : `Surat Keluar Contoh ${i}`,
      pic: 'Riski',
      keterangan: null,
      bagian_id: bagianMap['FIN'],
      jenis_surat_id: fin03Id,
      template_id: null,
      membalas_surat_masuk_id: i === 1 ? suratMasuk1.id : null,
      data_dinamis: JSON.stringify({ kepada: 'PT Contoh', isi: 'Isi surat' }),
      file_path: null,
      dibuat_oleh: adminUser.id,
      created_at: now, updated_at: now
    });
  }
  await knex('surat_keluar').insert(suratKeluarData);

  suratTerakhir += 3;
  await knex('counter')
    .where({ kunci: 'nomor_surat_keluar', tahun: tahunBerjalan })
    .update({ nomor_terakhir: suratTerakhir, updated_at: now });

  console.log('✅ Demo data berhasil ditambahkan:');
  console.log('   - 5 bagian baru (DIR, HR, ADM, MKT, ENG)');
  console.log('   - 11 jenis surat');
  console.log('   - 4 template + 12 field');
  console.log('   - 2 surat masuk');
  console.log('   - 2 disposisi + 3 riwayat + 2 notifikasi');
  console.log('   - 3 surat keluar');
};