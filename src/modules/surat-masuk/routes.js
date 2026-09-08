const express = require('express');
const { index, store } = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const upload = require('../../middlewares/upload');

const router = express.Router();

// Semua route di sini harus pakai token
router.use(authenticate);

router.get('/', index);
router.post('/', upload.single('file'), store); // <-- TAMBAHKAN INI

module.exports = router;