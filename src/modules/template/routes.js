const express = require('express');
const {
  index,
  show,
  store,
  update,
  ubahStatus,
  indexFields,
  storeField,
  updateField,
  deleteField
} = require('./controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// Template CRUD
router.get('/', index);
router.post('/', store);
router.get('/:id', show);
router.put('/:id', update);
router.patch('/:id/status', ubahStatus);

// Field dinamis
router.get('/:id/fields', indexFields);
router.post('/:id/fields', storeField);
router.put('/:id/fields/:fieldId', updateField);
router.delete('/:id/fields/:fieldId', deleteField);

module.exports = router;