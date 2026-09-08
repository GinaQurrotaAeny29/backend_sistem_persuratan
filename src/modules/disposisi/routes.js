const express = require('express');
const { 
  store, 
  indexSaya, 
  show, 
  tandaiBaca, 
  ubahStatus,
  riwayat 
} = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

router.use(authenticate);

router.post('/surat-masuk/:id/disposisi', authorize('admin'), store);
router.get('/disposisi/saya', indexSaya);
router.get('/disposisi/:id', show);
router.patch('/disposisi/:id/baca', tandaiBaca);
router.patch('/disposisi/:id/status', ubahStatus);
router.get('/disposisi/:id/riwayat', riwayat);

module.exports = router;