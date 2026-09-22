const express = require('express');
const { show, update } = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', show);
router.put('/', update);

module.exports = router;