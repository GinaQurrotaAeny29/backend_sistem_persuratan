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

// ROUTES
const authRoutes = require('./modules/auth/routes');
app.use('/api/auth', authRoutes);

const suratMasukRoutes = require('./modules/surat-masuk/routes');
app.use('/api/surat-masuk', suratMasukRoutes);

const pegawaiRoutes = require('./modules/pegawai/routes');
app.use('/api/pegawai', pegawaiRoutes);

const disposisiRoutes = require('./modules/disposisi/routes');
app.use('/api', disposisiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server sehat' });
});

module.exports = app;