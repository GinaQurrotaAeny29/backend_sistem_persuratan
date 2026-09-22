const express = require('express');
const { index, bacaSemua } = require('./controller');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

// Semua route notifikasi butuh token
router.use(authenticate);

router.get('/', index);
router.patch('/baca-semua', bacaSemua);

module.exports = router;