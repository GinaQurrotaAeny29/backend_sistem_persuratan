require('dotenv').config();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// === LOGO ===
const logoPath = path.join(__dirname, '../../../frontend/templatesurat/logo.png');
let logoBase64 = '';
try {
  const buf = fs.readFileSync(logoPath);
  logoBase64 = buf.toString('base64');
  console.log('[LOGO] ' + buf.length + ' bytes -> base64 ' + logoBase64.length + ' chars');
} catch (e) {
  console.warn('[LOGO] tidak ditemukan:', e.message);
}

// === KOP: 1 garis solid emas (bukan titik-titik) ===
function kop() {
  const logoTag = logoBase64
    ? '<img src="data:image/png;base64,' + logoBase64 + '" style="width:90px;height:auto;display:block;" />'
    : '<div style="width:90px;height:60px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#999;">LOGO</div>';
  return '<table style="width:100%;border-collapse:collapse;margin-bottom:4px;"><tr>'
    + '<td style="width:100px;vertical-align:middle;padding-right:16px;">' + logoTag + '</td>'
    + '<td style="vertical-align:middle;text-align:right;">'
    + '<p style="font-size:16pt;font-weight:bold;color:#3D2312;margin:0 0 4px 0;">DIGITAK</p>'
    + '<p style="font-size:9pt;margin:0;">Jl. Gn. Batu Dalam Komplek Citra Asri Permai No.C-26,</p>'
    + '<p style="font-size:9pt;margin:0;">Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40514</p>'
    + '<p style="font-size:9pt;margin:2px 0 0 0;">Email: info@digitak.id  |  Web: https://digitak.id/</p>'
    + '</td></tr></table>'
    + '<hr style="border:none;border-top:2px solid #D27A0F;margin:12px 0 18px 0;" />';
}

// === FIELD TETAP: selalu ada di semua template ===
const F_TANGGAL   = { kunci: 'tanggal',       label: 'Tanggal',         tipe: 'date',     wajib: true, urut: 1 };
const F_PERIHAL   = { kunci: 'perihal',       label: 'Perihal',         tipe: 'text',     wajib: true, urut: 2 };
const F_KOTA      = { kunci: 'kota',          label: 'Kota',            tipe: 'text',     wajib: true, bawaan: 'Cimahi', urut: 3 };
const F_KEPADA    = { kunci: 'kepada',        label: 'Kepada',          tipe: 'textarea', wajib: true, urut: 1 };
const F_ISI       = { kunci: 'isi',           label: 'Isi Surat',       tipe: 'textarea', wajib: true, urut: 4 };

function metaTable(extra) {
  var rows = '<tr><td style="width:80px;font-weight:bold;">Kepada</td><td>: {kepada}</td></tr>'
    + '<tr><td style="font-weight:bold;">Tanggal</td><td>: {tanggal}</td></tr>'
    + '<tr><td style="font-weight:bold;">Perihal</td><td>: {perihal}</td></tr>';
  if (extra) rows += extra;
  return '<table style="width:100%;font-size:10.5pt;margin-top:16px;border-collapse:collapse;">' + rows + '</table>';
}

function footerDitutup(namaField, jabatan) {
  return '<p style="font-size:10.5pt;margin-top:24px;">{kota}, {tanggal}</p>'
    + '<p style="text-align:right;font-size:10.5pt;margin-top:40px;padding-right:50px;">{' + namaField + '}</p>'
    + '<p style="text-align:right;font-size:10.5pt;margin:0;padding-right:50px;">' + jabatan + '</p>';
}

function footerDuaPihak() {
  return '<p style="font-size:10.5pt;margin-top:24px;">{kota}, {tanggal}</p>'
    + '<table style="width:100%;margin-top:32px;font-size:10.5pt;">'
    + '<tr><td style="width:50%;vertical-align:top;text-align:center;padding-right:20px;">'
    + '<p style="font-weight:bold;">{nama_pihak1}</p><p>{jabatan_pihak1}</p></td>'
    + '<td style="width:50%;vertical-align:top;text-align:center;padding-left:20px;">'
    + '<p style="font-weight:bold;">{nama_pihak2}</p><p>{jabatan_pihak2}</p></td></tr></table>';
}

// ============================================================
// DAFTAR JENIS SURAT + TEMPLATE (lengkap sesuai Excel)
// ============================================================
const jenisSurat = [
  // DIR (bagian_id=9)
  { kode: 'DIR.01', nama: 'Keputusan',         bagian: 9 },
  { kode: 'DIR.02', nama: 'Pemberitahuan',     bagian: 9 },
  { kode: 'DIR.03', nama: 'Tugas',             bagian: 9 },
  { kode: 'DIR.04', nama: 'Penawaran',         bagian: 9 },
  { kode: 'DIR.05', nama: 'Perjanjian Kerjasama', bagian: 9 },
  { kode: 'DIR.06', nama: 'Pernyataan Hutang', bagian: 9 },
  { kode: 'DIR.07', nama: 'Permohonan',        bagian: 9 },
  // HR (bagian_id=10)
  { kode: 'HR.01',  nama: 'Perjanjian Kerjasama', bagian: 10 },
  { kode: 'HR.02',  nama: 'SPD',              bagian: 10 },
  { kode: 'HR.03',  nama: 'Keterangan Kerja', bagian: 10 },
  { kode: 'HR.04',  nama: 'Peringatan',       bagian: 10 },
  { kode: 'HR.05',  nama: 'Referensi Kerja',  bagian: 10 },
  { kode: 'HR.06',  nama: 'Penunjukan Kerja', bagian: 10 },
  { kode: 'HR.07',  nama: 'Addendum Freelancer', bagian: 10 },
  { kode: 'HR.08',  nama: 'Keterangan Penghasilan', bagian: 10 },
  { kode: 'HR.09',  nama: 'Keputusan Kerja',  bagian: 10 },
  { kode: 'HR.10',  nama: 'Permintaan Pembayaran', bagian: 10 },
  // ADM (bagian_id=11)
  { kode: 'ADM.01', nama: 'Undangan Intern',  bagian: 11 },
  { kode: 'ADM.02', nama: 'Memo Libur',       bagian: 11 },
  { kode: 'ADM.03', nama: 'Nota Dinas',       bagian: 11 },
  { kode: 'ADM.04', nama: 'Pemasangan Iklan', bagian: 11 },
  { kode: 'ADM.05', nama: 'Keluhan',          bagian: 11 },
  { kode: 'ADM.06', nama: 'Serah Terima Barang', bagian: 11 },
  { kode: 'ADM.07', nama: 'Permohonan',       bagian: 11 },
  { kode: 'ADM.08', nama: 'Pengakuan Hutang', bagian: 11 },
  { kode: 'ADM.09', nama: 'Pemberitahuan',    bagian: 11 },
  { kode: 'ADM.10', nama: 'Permintaan Pembayaran', bagian: 11 },
  // FIN (bagian_id=8)
  { kode: 'FIN.01', nama: 'Pemberitahuan',    bagian: 8 },
  { kode: 'FIN.02', nama: 'Pembayaran',       bagian: 8 },
  { kode: 'FIN.03', nama: 'Invoice',          bagian: 8 },
  { kode: 'FIN.04', nama: 'Kuitansi',         bagian: 8 },
  { kode: 'FIN.05', nama: 'Permintaan Pembayaran', bagian: 8 },
  { kode: 'FIN.06', nama: 'Laporan Penerimaan', bagian: 8 },
  // MKT (bagian_id=12)
  { kode: 'MKT.01', nama: 'Perkenalan',       bagian: 12 },
  { kode: 'MKT.02', nama: 'Penawaran',        bagian: 12 },
  { kode: 'MKT.03', nama: 'Pemberitahuan',    bagian: 12 },
  { kode: 'MKT.04', nama: 'Permintaan Pembayaran', bagian: 12 },
  { kode: 'MKT.05', nama: 'Laporan Penerimaan', bagian: 12 },
  // ENG (bagian_id=13)
  { kode: 'ENG.01', nama: 'Kontrak Kerjasama', bagian: 13 },
  { kode: 'ENG.02', nama: 'PO',               bagian: 13 },
  { kode: 'ENG.03', nama: 'Surat Jalan',      bagian: 13 },
  { kode: 'ENG.04', nama: 'Serah Terima',     bagian: 13 },
  { kode: 'ENG.05', nama: 'Surat Peringatan', bagian: 13 },
  { kode: 'ENG.06', nama: 'Pemberitahuan',    bagian: 13 },
];

// ============================================================
// TEMPLATE HTML — berdasarkan tipe surat
// ============================================================

function tplIsiSederhana(judul) {
  return kop()
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + footerDitutup('nama_penandatangan', 'Direktur Utama');
}

function tplIsiDenganKeterangan(judul) {
  return kop()
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>'
    + footerDitutup('nama_penandatangan', 'Direktur Utama');
}

function tplSuratKeputusan() {
  return kop()
    + '<p style="text-align:center;font-size:11pt;font-weight:bold;text-decoration:underline;margin-top:24px;">SURAT KEPUTUSAN</p>'
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>'
    + footerDitutup('nama_penandatangan', 'Direktur Utama');
}

function tplDuaPihak(judul) {
  return kop()
    + '<p style="text-align:center;font-size:11pt;font-weight:bold;text-decoration:underline;margin-top:24px;">' + judul.toUpperCase() + '</p>'
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>'
    + footerDuaPihak();
}

function tplTabelItem(judul) {
  return kop()
    + '<p style="text-align:center;font-size:11pt;font-weight:bold;text-decoration:underline;margin-top:24px;">' + judul.toUpperCase() + '</p>'
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + '<table style="width:100%;font-size:10.5pt;margin-top:12px;border:1px solid #000;border-collapse:collapse;">'
    + '<tr style="background:#f0f0f0;"><th style="border:1px solid #000;padding:6px 8px;text-align:left;">No</th>'
    + '<th style="border:1px solid #000;padding:6px 8px;text-align:left;">Deskripsi</th>'
    + '<th style="border:1px solid #000;padding:6px 8px;text-align:right;">Qty</th>'
    + '<th style="border:1px solid #000;padding:6px 8px;text-align:right;">Harga</th></tr>'
    + '<tr><td style="border:1px solid #000;padding:6px 8px;">1</td>'
    + '<td style="border:1px solid #000;padding:6px 8px;">{item1_deskripsi}</td>'
    + '<td style="border:1px solid #000;padding:6px 8px;text-align:right;">{item1_qty}</td>'
    + '<td style="border:1px solid #000;padding:6px 8px;text-align:right;">Rp {item1_harga}</td></tr>'
    + '</table>'
    + '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>'
    + footerDitutup('nama_penandatangan', 'Direktur Utama');
}

function tplInvoice() {
  return kop()
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + '<table style="width:100%;font-size:10.5pt;margin-top:12px;border:1px solid #000;border-collapse:collapse;">'
    + '<tr style="background:#f0f0f0;"><th style="border:1px solid #000;padding:6px 8px;text-align:left;">Deskripsi</th>'
    + '<th style="border:1px solid #000;padding:6px 8px;text-align:right;">Qty</th>'
    + '<th style="border:1px solid #000;padding:6px 8px;text-align:right;">Harga</th>'
    + '<th style="border:1px solid #000;padding:6px 8px;text-align:right;">Jumlah</th></tr>'
    + '<tr><td style="border:1px solid #000;padding:6px 8px;">{item1_deskripsi}</td>'
    + '<td style="border:1px solid #000;padding:6px 8px;text-align:right;">{item1_qty}</td>'
    + '<td style="border:1px solid #000;padding:6px 8px;text-align:right;">Rp {item1_harga}</td>'
    + '<td style="border:1px solid #000;padding:6px 8px;text-align:right;">Rp {item1_jumlah}</td></tr>'
    + '</table>'
    + '<p style="font-size:10.5pt;margin-top:8px;text-align:right;"><strong>TOTAL: Rp {total}</strong></p>'
    + '<p style="font-size:10.5pt;margin-top:4px;">Terbilang: {terbilang}</p>'
    + '<p style="font-size:10.5pt;margin-top:8px;">Bank: {bank} | No. Rek: {rekening}</p>'
    + '<p style="font-size:10.5pt;margin-top:4px;">Batas Bayar: {berlaku_hingga}</p>'
    + '<p style="font-size:10.5pt;margin-top:8px;text-align:justify;">{keterangan}</p>'
    + footerDitutup('nama_penandatangan', 'Direktur Utama');
}

function tplUndangan() {
  return kop()
    + metaTable()
    + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
    + '<table style="width:100%;font-size:10.5pt;margin-top:12px;border:1px solid #000;border-collapse:collapse;">'
    + '<tr><td style="width:140px;padding:6px 8px;font-weight:bold;border:1px solid #000;">Hari/Tanggal</td><td style="padding:6px 8px;border:1px solid #000;">{hari_tanggal}</td></tr>'
    + '<tr><td style="padding:6px 8px;font-weight:bold;border:1px solid #000;">Waktu</td><td style="padding:6px 8px;border:1px solid #000;">{waktu}</td></tr>'
    + '<tr><td style="padding:6px 8px;font-weight:bold;border:1px solid #000;">Tempat</td><td style="padding:6px 8px;border:1px solid #000;">{tempat}</td></tr>'
    + '<tr><td style="padding:6px 8px;font-weight:bold;border:1px solid #000;">Agenda</td><td style="padding:6px 8px;border:1px solid #000;">{agenda}</td></tr>'
    + '</table>'
    + '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>'
    + footerDitutup('nama_penandatangan', 'Direktur Utama');
}

// ============================================================
// MAPPING: kode -> { judul, fields[] }
// ============================================================
const fieldMap = {
  'DIR.01': { judul: 'SURAT KEPUTUSAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'menimbang', label: 'Menimbang', tipe: 'textarea', wajib: true, urut: 5 },
    { kunci: 'mengingat', label: 'Mengingat', tipe: 'textarea', wajib: true, urut: 6 },
    { kunci: 'memutuskan', label: 'Memutuskan', tipe: 'textarea', wajib: true, urut: 7 },
    { kunci: 'nama_penandatangan', label: 'Nama Direktur', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 8 },
  ]},
  'DIR.02': { judul: 'SURAT PEMBERITAHUAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Direktur', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'DIR.03': { judul: 'SURAT TUGAS', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'hari_tanggal', label: 'Hari/Tanggal Pelaksanaan', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'waktu', label: 'Waktu', tipe: 'text', wajib: true, bawaan: '09.00 WIB - selesai', urut: 6 },
    { kunci: 'tempat', label: 'Tempat', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'agenda', label: 'Agenda', tipe: 'textarea', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 9 },
    { kunci: 'nama_penandatangan', label: 'Nama Direktur', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 10 },
  ]},
  'DIR.04': { judul: 'SURAT PENAWARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi Item', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 8 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Ahmad Abdullah', urut: 9 },
  ]},
  'DIR.05': { judul: 'PERJANJIAN KERJASAMA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pihak1', label: 'Nama Pihak 1', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 5 },
    { kunci: 'jabatan_pihak1', label: 'Jabatan Pihak 1', tipe: 'text', wajib: true, bawaan: 'Direktur Utama', urut: 6 },
    { kunci: 'nama_pihak2', label: 'Nama Pihak 2', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'jabatan_pihak2', label: 'Jabatan Pihak 2', tipe: 'text', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Klausul', tipe: 'textarea', wajib: false, urut: 9 },
  ]},
  'DIR.06': { judul: 'SURAT PERNYATAAN HUTANG', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'DIR.07': { judul: 'SURAT PERMOHONAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'HR.01':  { judul: 'PERJANJIAN KERJASAMA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pihak1', label: 'Nama Pihak 1', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 5 },
    { kunci: 'jabatan_pihak1', label: 'Jabatan Pihak 1', tipe: 'text', wajib: true, bawaan: 'Direktur Utama', urut: 6 },
    { kunci: 'nama_pihak2', label: 'Nama Pihak 2', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'jabatan_pihak2', label: 'Jabatan Pihak 2', tipe: 'text', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Klausul', tipe: 'textarea', wajib: false, urut: 9 },
  ]},
  'HR.02':  { judul: 'SURAT PERINTAH PERJALANAN DINAS', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pegawai', label: 'Nama Pegawai', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'nip', label: 'NIP', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'tujuan', label: 'Tujuan Perjalanan', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'tanggal_mulai', label: 'Tanggal Mulai', tipe: 'date', wajib: true, urut: 8 },
    { kunci: 'tanggal_selesai', label: 'Tanggal Selesai', tipe: 'date', wajib: true, urut: 9 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 10 },
    { kunci: 'nama_penandatangan', label: 'Nama Pejabat', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 11 },
  ]},
  'HR.03':  { judul: 'SURAT KETERANGAN KERJA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pegawai', label: 'Nama Pegawai', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'nip', label: 'NIP', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'jabatan', label: 'Jabatan', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'tanggal_mulai', label: 'Tanggal Mulai Kerja', tipe: 'date', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 9 },
    { kunci: 'nama_penandatangan', label: 'Nama Pejabat', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 10 },
  ]},
  'HR.04':  { judul: 'SURAT PERINGATAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan/Konsekuensi', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Pejabat', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'HR.05':  { judul: 'SURAT REFERENSI KERJA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pegawai', label: 'Nama Pegawai', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'nip', label: 'NIP', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 7 },
    { kunci: 'nama_penandatangan', label: 'Nama Pejabat', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 8 },
  ]},
  'HR.06':  { judul: 'SURAT PENUNJUKAN KERJA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pegawai', label: 'Nama Pegawai', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'nip', label: 'NIP', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'jabatan_baru', label: 'Jabatan Baru', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 8 },
    { kunci: 'nama_penandatangan', label: 'Nama Pejabat', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 9 },
  ]},
  'HR.07':  { judul: 'ADDENDUM FREELANCER', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Klausul Tambahan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_pihak1', label: 'Nama Pihak 1', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
    { kunci: 'jabatan_pihak1', label: 'Jabatan Pihak 1', tipe: 'text', wajib: true, bawaan: 'Direktur Utama', urut: 7 },
    { kunci: 'nama_pihak2', label: 'Nama Pihak 2', tipe: 'text', wajib: true, urut: 8 },
    { kunci: 'jabatan_pihak2', label: 'Jabatan Pihak 2', tipe: 'text', wajib: true, urut: 9 },
  ]},
  'HR.08':  { judul: 'SURAT KETERANGAN PENGHASILAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pegawai', label: 'Nama Pegawai', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'nip', label: 'NIP', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'jabatan', label: 'Jabatan', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'penghasilan', label: 'Penghasilan', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 9 },
    { kunci: 'nama_penandatangan', label: 'Nama Pejabat', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 10 },
  ]},
  'HR.09':  { judul: 'SURAT KEPUTUSAN KERJA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'menimbang', label: 'Menimbang', tipe: 'textarea', wajib: true, urut: 5 },
    { kunci: 'mengingat', label: 'Mengingat', tipe: 'textarea', wajib: true, urut: 6 },
    { kunci: 'memutuskan', label: 'Memutuskan', tipe: 'textarea', wajib: true, urut: 7 },
    { kunci: 'nama_penandatangan', label: 'Nama Direktur', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 8 },
  ]},
  'HR.10':  { judul: 'SURAT PERMOHONAN PEMBAYARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 14 },
  ]},
  'ADM.01': { judul: 'SURAT UNDANGAN INTERN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'hari_tanggal', label: 'Hari/Tanggal', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'waktu', label: 'Waktu', tipe: 'text', wajib: true, bawaan: '09.00 WIB', urut: 6 },
    { kunci: 'tempat', label: 'Tempat', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'agenda', label: 'Agenda', tipe: 'textarea', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 9 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 10 },
  ]},
  'ADM.02': { judul: 'MEMO INTERNAL', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.03': { judul: 'NOTA DINAS', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.04': { judul: 'SURAT PEMASANGAN IKLAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.05': { judul: 'SURAT KELUHAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.06': { judul: 'BERITA ACARA SERAH TERIMA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi Barang', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga/Nilai', tipe: 'number', wajib: false, urut: 7 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 8 },
    { kunci: 'nama_pihak1', label: 'Nama Pihak Penyerah', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'jabatan_pihak1', label: 'Jabatan Pihak 1', tipe: 'text', wajib: true, urut: 10 },
    { kunci: 'nama_pihak2', label: 'Nama Pihak Penerima', tipe: 'text', wajib: true, urut: 11 },
    { kunci: 'jabatan_pihak2', label: 'Jabatan Pihak 2', tipe: 'text', wajib: true, urut: 12 },
  ]},
  'ADM.07': { judul: 'SURAT PERMOHONAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.08': { judul: 'SURAT PENGAKUAN HUTANG', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.09': { judul: 'SURAT PEMBERITAHUAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ADM.10': { judul: 'SURAT PERMOHONAN PEMBAYARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 14 },
  ]},
  'FIN.01': { judul: 'SURAT PEMBERITAHUAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'FIN.02': { judul: 'SURAT PEMBAYARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 14 },
  ]},
  'FIN.03': { judul: 'INVOICE', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi Item', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga Satuan', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'item1_jumlah', label: 'Jumlah', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 9 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 10 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 11 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 12 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 13 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 14 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 15 },
  ]},
  'FIN.04': { judul: 'KUITANSI', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 14 },
  ]},
  'FIN.05': { judul: 'SURAT PERMOHONAN PEMBAYARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 14 },
  ]},
  'FIN.06': { judul: 'LAPORAN PENERIMAAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 14 },
  ]},
  'MKT.01': { judul: 'SURAT PERKENALAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Ahmad Abdullah', urut: 6 },
  ]},
  'MKT.02': { judul: 'SURAT PENAWARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Paket Layanan', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'berlaku_hingga', label: 'Berlaku Hingga', tipe: 'date', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 9 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Ahmad Abdullah', urut: 10 },
  ]},
  'MKT.03': { judul: 'SURAT PEMBERITAHUAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Ahmad Abdullah', urut: 6 },
  ]},
  'MKT.04': { judul: 'SURAT PERMOHONAN PEMBAYARAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Ahmad Abdullah', urut: 14 },
  ]},
  'MKT.05': { judul: 'LAPORAN PENERIMAAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'bank', label: 'Bank', tipe: 'text', wajib: true, bawaan: 'Bank Mandiri', urut: 10 },
    { kunci: 'rekening', label: 'No. Rekening', tipe: 'text', wajib: true, bawaan: '123-456-7890', urut: 11 },
    { kunci: 'berlaku_hingga', label: 'Batas Bayar', tipe: 'date', wajib: true, urut: 12 },
    { kunci: 'keterangan', label: 'Catatan', tipe: 'textarea', wajib: false, urut: 13 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Ahmad Abdullah', urut: 14 },
  ]},
  'ENG.01': { judul: 'KONTRAK KERJASAMA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'nama_pihak1', label: 'Nama Pihak 1', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 5 },
    { kunci: 'jabatan_pihak1', label: 'Jabatan Pihak 1', tipe: 'text', wajib: true, bawaan: 'Direktur Utama', urut: 6 },
    { kunci: 'nama_pihak2', label: 'Nama Pihak 2', tipe: 'text', wajib: true, urut: 7 },
    { kunci: 'jabatan_pihak2', label: 'Jabatan Pihak 2', tipe: 'text', wajib: true, urut: 8 },
    { kunci: 'keterangan', label: 'Klausul', tipe: 'textarea', wajib: false, urut: 9 },
  ]},
  'ENG.02': { judul: 'PURCHASE ORDER', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi Item', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga', tipe: 'number', wajib: true, urut: 7 },
    { kunci: 'total', label: 'Total', tipe: 'number', wajib: true, urut: 8 },
    { kunci: 'terbilang', label: 'Terbilang', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 10 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 11 },
  ]},
  'ENG.03': { judul: 'SURAT JALAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi Barang', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 7 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 8 },
  ]},
  'ENG.04': { judul: 'BERITA ACARA SERAH TERIMA', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'item1_deskripsi', label: 'Deskripsi Barang', tipe: 'text', wajib: true, urut: 5 },
    { kunci: 'item1_qty', label: 'Qty', tipe: 'text', wajib: true, urut: 6 },
    { kunci: 'item1_harga', label: 'Harga/Nilai', tipe: 'number', wajib: false, urut: 7 },
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 8 },
    { kunci: 'nama_pihak1', label: 'Nama Pihak Penyerah', tipe: 'text', wajib: true, urut: 9 },
    { kunci: 'jabatan_pihak1', label: 'Jabatan Pihak 1', tipe: 'text', wajib: true, urut: 10 },
    { kunci: 'nama_pihak2', label: 'Nama Pihak Penerima', tipe: 'text', wajib: true, urut: 11 },
    { kunci: 'jabatan_pihak2', label: 'Jabatan Pihak 2', tipe: 'text', wajib: true, urut: 12 },
  ]},
  'ENG.05': { judul: 'SURAT PERINGATAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
  'ENG.06': { judul: 'SURAT PEMBERITAHUAN', fields: [
    F_TANGGAL, F_PERIHAL, F_KOTA, F_KEPADA, F_ISI,
    { kunci: 'keterangan', label: 'Keterangan', tipe: 'textarea', wajib: false, urut: 5 },
    { kunci: 'nama_penandatangan', label: 'Nama Penandatangan', tipe: 'text', wajib: true, bawaan: 'Rina Marlina', urut: 6 },
  ]},
};

// ============================================================
// RUN
// ============================================================
async function run() {
  try {
    // 1. Sisip jenis_surat yang belum ada
    let inserted = 0;
    for (const js of jenisSurat) {
      const existing = await db('jenis_surat').where({ kode: js.kode }).first();
      if (!existing) {
        await db('jenis_surat').insert({ kode: js.kode, nama: js.nama, bagian_id: js.bagian, status: 'aktif' });
        inserted++;
      }
    }
    console.log('[DB] ' + inserted + ' jenis_surat baru diinsert');

    // 2. Bangun daftar kode -> jenis_surat_id
    const allJenis = await db('jenis_surat').orderBy('kode');
    const kodeToId = {};
    allJenis.forEach(j => { kodeToId[j.kode] = j.id; });

    // 3. Update/buat template
    let updated = 0, created = 0;
    for (const js of jenisSurat) {
      const jenisId = kodeToId[js.kode];
      if (!jenisId) { console.warn('[SKIP] ' + js.kode + ' tidak ditemukan di DB'); continue; }

      const meta = fieldMap[js.kode];
      const judul = meta.judul;
      const fields = meta.fields;

      // HTML
      const html = kop() + metaTable() + '<p style="font-size:10.5pt;margin-top:16px;text-align:justify;">{isi}</p>'
        + (fields.some(f => f.kunci === 'keterangan') ? '<p style="font-size:10.5pt;margin-top:12px;text-align:justify;">{keterangan}</p>' : '')
        + footerDitutup('nama_penandatangan', 'Direktur Utama');

      // Cari template yang sudah ada untuk jenis_surat ini
      const existing = await db('template_surat').where({ jenis_surat_id: jenisId }).first();

      if (existing) {
        await db('template_surat').where({ id: existing.id }).update({ konten_html: html });
        await db('template_field').where({ template_id: existing.id }).del();
        const rows = fields.map(f => ({
          template_id: existing.id, field_key: f.kunci, label: f.label, tipe: f.tipe,
          is_required: f.wajib ? 1 : 0, nilai_bawaan: f.bawaan || null, urutan: f.urut, opsi: null
        }));
        await db('template_field').insert(rows);
        updated++;
      } else {
        const [id] = await db('template_surat').insert({
          nama: judul, jenis_surat_id: jenisId, konten_html: html,
          format_nomor: '{urut}/{bagian}.{kode}/{perusahaan}/{bulan_romawi}/{tahun}',
          is_active: true
        });
        const rows = fields.map(f => ({
          template_id: id, field_key: f.kunci, label: f.label, tipe: f.tipe,
          is_required: f.wajib ? 1 : 0, nilai_bawaan: f.bawaan || null, urutan: f.urut, opsi: null
        }));
        await db('template_field').insert(rows);
        created++;
      }
    }
    console.log('[TPL] ' + updated + ' template diupdate, ' + created + ' template baru dibuat');
    console.log('[DONE] Selesai. Total jenis_surat: ' + allJenis.length + ' (+' + inserted + ' baru)');

    process.exit(0);
  } catch (err) {
    console.error('Gagal:', err.message);
    process.exit(1);
  }
}

run();
