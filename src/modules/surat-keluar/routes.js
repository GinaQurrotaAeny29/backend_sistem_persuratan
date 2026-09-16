const express = require('express');
const { index, show, store, downloadFile, tersedia } = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// PENTING: /tersedia harus di atas /:id
router.get('/tersedia', tersedia);

router.get('/', index);
router.post('/', store);
router.get('/:id', show);
router.get('/:id/file', downloadFile);

module.exports = router;