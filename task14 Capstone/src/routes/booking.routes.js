const express = require('express');
const controller = require('../controllers/booking.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const schemas = require('../validators/booking.validators');

const router = express.Router();

router.get('/me', authenticate, validate(schemas.list), controller.listMine);
router.delete('/:id', authenticate, validate(schemas.idParam), controller.cancel);

module.exports = router;
