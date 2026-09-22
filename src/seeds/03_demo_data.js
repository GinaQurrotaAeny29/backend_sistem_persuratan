// ============================================
// Seed Demo Data — 03_demo_data.js
// Sifat: append-only (tidak hapus data lama)
// Isi: 5 bagian baru, 11 jenis surat, 4 template + 12 field,
//      2 surat masuk, 2 disposisi + riwayat + notifikasi, 3 surat keluar
// ============================================

exports.seed = async function (knex) {
  // Matikan foreign key check sementara agar tidak error saat delete/insert
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0;');

  await knex('riwayat_disposisi').del();
  await knex('notifikasi').del();
  await knex('disposisi').del();
  await knex('surat_keluar').del();
  await knex('surat_masuk').del();
  await knex('template_field').del();
  await knex('template_surat').del();
  await knex('jenis_surat').del();
  await knex('bagian').del();

  const now = new Date();
  const tahunBerjalan = now.getFullYear();

  // 1. Tambah bagian secara lengkap dengan ID spesifik
  await knex('bagian').insert([
    { id: 15, kode: 'FIN', nama: 'Keuangan', urutan_tampil: 4, status: 'aktif', created_at: now, updated_at: now },
    { id: 16, kode: 'DIR', nama: 'Direksi', urutan_tampil: 1, status: 'aktif', created_at: now, updated_at: now },
    { id: 17, kode: 'HR', nama: 'Personalia', urutan_tampil: 2, status: 'aktif', created_at: now, updated_at: now },
    { id: 18, kode: 'ADM', nama: 'Administrasi', urutan_tampil: 3, status: 'aktif', created_at: now, updated_at: now },
    { id: 19, kode: 'MKT', nama: 'Marketing', urutan_tampil: 4, status: 'aktif', created_at: now, updated_at: now },
    { id: 20, kode: 'ENG', nama: 'Engineering', urutan_tampil: 5, status: 'aktif', created_at: now, updated_at: now }
  ]);

  const bagianMap = { DIR: 16, HR: 17, ADM: 18, FIN: 15, MKT: 19, ENG: 20 };


  // 2. Jenis surat lengkap
  await knex('jenis_surat').insert([
    { id: 1, kode: 'DIR.01', nama: 'Keputusan', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    { id: 2, kode: 'DIR.02', nama: 'Pemberitahuan', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    { id: 3, kode: 'DIR.03', nama: 'Tugas', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    { id: 4, kode: 'DIR.04', nama: 'Penawaran', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    { id: 5, kode: 'DIR.05', nama: 'Perjanjian Kerjasama', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    { id: 6, kode: 'DIR.06', nama: 'Pernyataan Hutang', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    { id: 7, kode: 'DIR.07', nama: 'Permohonan', bagian_id: 16, status: 'aktif', created_at: now, updated_at: now },
    
    { id: 8, kode: 'HR.01', nama: 'Perjanjian Kerjasama', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 9, kode: 'HR.02', nama: 'SPD', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 10, kode: 'HR.03', nama: 'Keterangan Kerja', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 11, kode: 'HR.04', nama: 'Peringatan', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 12, kode: 'HR.05', nama: 'Referensi Kerja', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 13, kode: 'HR.06', nama: 'Penunjukan Kerja', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 14, kode: 'HR.07', nama: 'Addendum Freelancer', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 15, kode: 'HR.08', nama: 'Keterangan Penghasilan', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 16, kode: 'HR.09', nama: 'Keputusan Kerja', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    { id: 17, kode: 'HR.10', nama: 'Permintaan Pembayaran', bagian_id: 17, status: 'aktif', created_at: now, updated_at: now },
    
    { id: 18, kode: 'ADM.01', nama: 'Undangan Intern', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 19, kode: 'ADM.02', nama: 'Memo Libur', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 20, kode: 'ADM.03', nama: 'Nota Dinas/Surat Tugas/Surat Jalan', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 21, kode: 'ADM.04', nama: 'Pemasangan Iklan', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 22, kode: 'ADM.05', nama: 'Keluhan', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 23, kode: 'ADM.06', nama: 'Serah Terima Barang', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 24, kode: 'ADM.07', nama: 'Permohonan', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 25, kode: 'ADM.08', nama: 'Pengakuan Hutang', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 26, kode: 'ADM.09', nama: 'Pemberitahuan', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    { id: 27, kode: 'ADM.10', nama: 'Permintaan Pembayaran', bagian_id: 18, status: 'aktif', created_at: now, updated_at: now },
    
    { id: 28, kode: 'FIN.01', nama: 'Pemberitahuan', bagian_id: 15, status: 'aktif', created_at: now, updated_at: now },
    { id: 29, kode: 'FIN.02', nama: 'Pembayaran', bagian_id: 15, status: 'aktif', created_at: now, updated_at: now },
    { id: 30, kode: 'FIN.03', nama: 'Invoice', bagian_id: 15, status: 'aktif', created_at: now, updated_at: now },
    { id: 31, kode: 'FIN.04', nama: 'Kuitansi', bagian_id: 15, status: 'aktif', created_at: now, updated_at: now },
    { id: 32, kode: 'FIN.05', nama: 'Permintaan Pembayaran', bagian_id: 15, status: 'aktif', created_at: now, updated_at: now },
    { id: 33, kode: 'FIN.06', nama: 'Laporan Penerimaan', bagian_id: 15, status: 'aktif', created_at: now, updated_at: now },
    
    { id: 34, kode: 'MKT.01', nama: 'Perkenalan', bagian_id: 19, status: 'aktif', created_at: now, updated_at: now },
    { id: 35, kode: 'MKT.02', nama: 'Penawaran', bagian_id: 19, status: 'aktif', created_at: now, updated_at: now },
    { id: 36, kode: 'MKT.03', nama: 'Pemberitahuan', bagian_id: 19, status: 'aktif', created_at: now, updated_at: now },
    { id: 37, kode: 'MKT.04', nama: 'Permintaan Pembayaran', bagian_id: 19, status: 'aktif', created_at: now, updated_at: now },
    { id: 38, kode: 'MKT.05', nama: 'Laporan Penerimaan', bagian_id: 19, status: 'aktif', created_at: now, updated_at: now },
    
    { id: 39, kode: 'ENG.01', nama: 'Kontrak Kerjasama', bagian_id: 20, status: 'aktif', created_at: now, updated_at: now },
    { id: 40, kode: 'ENG.02', nama: 'PO', bagian_id: 20, status: 'aktif', created_at: now, updated_at: now },
    { id: 41, kode: 'ENG.03', nama: 'Surat Jalan', bagian_id: 20, status: 'aktif', created_at: now, updated_at: now },
    { id: 42, kode: 'ENG.04', nama: 'Serah Terima', bagian_id: 20, status: 'aktif', created_at: now, updated_at: now },
    { id: 43, kode: 'ENG.05', nama: 'Surat Peringatan', bagian_id: 20, status: 'aktif', created_at: now, updated_at: now },
    { id: 44, kode: 'ENG.06', nama: 'Pemberitahuan', bagian_id: 20, status: 'aktif', created_at: now, updated_at: now }
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
  // 4. Template + field otomatis untuk SEMUA (44) Jenis Surat
  // ============================================
  const defaultKonten = `<div class="kop-surat">
  <table class="kop-table">
    <tr>
      <td class="logo-cell">
        <img src="data:image/png;base64,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" class="logo-img" alt="Logo PT Metanouva" />
      </td>
      <td class="text-cell">
        <h1>PT. METANOUVA INFORMATIKA</h1>
        <p>Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26, Cimahi</p>
        <p>Email: info@digitak.id</p>
      </td>
    </tr>
  </table>
</div>

<div class="nomor-surat">Nomor: {nomor_surat}</div>
<div class="perihal">Perihal: {perihal}</div>

<div class="kepada">
  <p>Kepada Yth.</p>
  <p><b>{kepada}</b></p>
  <p>di tempat</p>
</div>

<div class="isi-surat">
  <p>Dengan hormat,</p>
  <p>{isi}</p>
</div>

<div class="penutup">
  <p>Demikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
</div>

<div class="ttd-container">
  <div class="ttd-box">
    <p class="hormat">Hormat kami,</p>
    <br><br><br>
    <p><b>{pic}</b></p>
    <p>{jabatan}</p>
  </div>
</div>`;

  const templatesToInsert = [];
  const fieldsToInsert = [];

  const allJenisSurat = await knex('jenis_surat').select('id', 'nama', 'kode');

  for (const j of allJenisSurat) {
    templatesToInsert.push({
      nama: `Template ${j.nama}`,
      jenis_surat_id: j.id,
      konten_html: defaultKonten,
      format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  }

  await knex('template_surat').insert(templatesToInsert);

  const insertedTemplates = await knex('template_surat').select('id');

  for (const t of insertedTemplates) {
    fieldsToInsert.push(
      { template_id: t.id, field_key: 'kepada', label: 'Kepada', tipe: 'text', is_required: 1, urutan: 1, created_at: now, updated_at: now },
      { template_id: t.id, field_key: 'perihal', label: 'Perihal', tipe: 'text', is_required: 1, urutan: 2, created_at: now, updated_at: now },
      { template_id: t.id, field_key: 'tanggal_surat', label: 'Tanggal Surat', tipe: 'date', is_required: 1, urutan: 3, created_at: now, updated_at: now },
      { template_id: t.id, field_key: 'pic', label: 'PIC / Penandatangan', tipe: 'text', is_required: 0, urutan: 4, created_at: now, updated_at: now },
      { template_id: t.id, field_key: 'jabatan', label: 'Jabatan Penandatangan', tipe: 'select', is_required: 0, urutan: 5, opsi: JSON.stringify(['Direktur Utama','Kepala Bagian Administrasi','Kepala Bagian Keuangan','Kepala Bagian Personalia','Staf','Manager']), created_at: now, updated_at: now },
      { template_id: t.id, field_key: 'isi', label: 'Isi Surat', tipe: 'textarea', is_required: 1, urutan: 6, created_at: now, updated_at: now }
    );
  }

  await knex('template_field').insert(fieldsToInsert);

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