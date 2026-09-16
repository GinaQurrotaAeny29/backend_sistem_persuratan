const express = require('express');
const {
  getPenerimaDisposisi,
  index,
  show,
  store,
  update,
  ubahStatus
} = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// PENTING: route spesifik harus di atas /:id
router.get('/penerima-disposisi', getPenerimaDisposisi);

// CRUD
router.get('/', index);
router.get('/:id', show);
router.post('/', store);
router.put('/:id', update);
router.patch('/:id/status', ubahStatus);

module.exports = router;