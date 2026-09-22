const express = require('express');
const { index, show, store, update, ubahStatus } = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

// Semua butuh login
router.use(authenticate);

// GET: admin & pegawai boleh akses
router.get('/', index);
router.get('/:id', show);

// POST, PUT, PATCH: hanya admin
router.post('/', authorize('admin'), store);
router.put('/:id', authorize('admin'), update);
router.patch('/:id/status', authorize('admin'), ubahStatus);

module.exports = router;