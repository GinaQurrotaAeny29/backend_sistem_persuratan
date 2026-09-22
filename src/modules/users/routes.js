const express = require('express');
const { index, show, store, update, ubahStatus, tersedia } = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

// Semua butuh login + harus admin
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', index);
// PENTING: /tersedia harus di ATAS /:id
router.get('/tersedia', tersedia);
router.get('/:id', show);
router.post('/', store);
router.put('/:id', update);
router.patch('/:id/status', ubahStatus);

module.exports = router;