const express = require('express');
const { getPenerimaDisposisi } = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

// Semua route di sini harus pakai token
router.use(authenticate);

// Hanya admin yang bisa akses
router.get('/penerima-disposisi', authorize('admin'), getPenerimaDisposisi);

module.exports = router;