const express = require('express');
const {
  index,
  show,
  store,
  downloadFile,
  setSuratBalasan,
  deleteSuratBalasan
} = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const upload = require('../../middlewares/upload');

const router = express.Router();

// Semua route surat masuk harus pakai authenticate (login dulu)
router.use(authenticate);

// GET /surat-masuk
router.get('/', index);

// POST /surat-masuk (admin only, multipart)
router.post('/', authorize('admin'), upload.single('file'), store);

// GET /surat-masuk/:id
router.get('/:id', show);

// GET /surat-masuk/:id/file
router.get('/:id/file', downloadFile);

// PATCH /surat-masuk/:id/surat-balasan (admin only)
router.patch('/:id/surat-balasan', authorize('admin'), setSuratBalasan);

// DELETE /surat-masuk/:id/surat-balasan (admin only)
router.delete('/:id/surat-balasan', authorize('admin'), deleteSuratBalasan);

module.exports = router;