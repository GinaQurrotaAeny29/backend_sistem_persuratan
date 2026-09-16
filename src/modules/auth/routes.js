const express = require('express');
const { login, me, ubahPassword, logout } = require('./controller');
const authenticate = require('../../middlewares/authenticate');

const router = express.Router();

// Publik (tidak perlu token)
router.post('/login', login);

// Butuh token (auth)
router.get('/me', authenticate, me);
router.patch('/password', authenticate, ubahPassword);
router.post('/logout', authenticate, logout);

module.exports = router;