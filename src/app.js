require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Auth
const authRoutes = require('./modules/auth/routes');
app.use('/api/auth', authRoutes);

// Surat Masuk
const suratMasukRoutes = require('./modules/surat-masuk/routes');
app.use('/api/surat-masuk', suratMasukRoutes);

// Pegawai
const pegawaiRoutes = require('./modules/pegawai/routes');
app.use('/api/pegawai', pegawaiRoutes);

// Disposisi
const disposisiRoutes = require('./modules/disposisi/routes');
app.use('/api', disposisiRoutes);

// Notifikasi
const notifikasiRoutes = require('./modules/notifikasi/routes');
app.use('/api/notifikasi', notifikasiRoutes);

// Master: Bagian
const bagianRoutes = require('./modules/bagian/routes');
app.use('/api/master/bagian', bagianRoutes);

// Master: Jenis Surat
const jenisSuratRoutes = require('./modules/jenis-surat/routes');
app.use('/api/master/jenis-surat', jenisSuratRoutes);

// Master: Template
const templateRoutes = require('./modules/template/routes');
app.use('/api/master/template', templateRoutes);

// Master: Penomoran
const penomoranRoutes = require('./modules/penomoran/routes');
app.use('/api/master/penomoran', penomoranRoutes);

// Surat Keluar
const suratKeluarRoutes = require('./modules/surat-keluar/routes');
app.use('/api/surat-keluar', suratKeluarRoutes);

// Users
const usersRoutes = require('./modules/users/routes');
app.use('/api/users', usersRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server sehat' });
});

module.exports = app;