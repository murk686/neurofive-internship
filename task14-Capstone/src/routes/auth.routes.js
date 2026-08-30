const express = require('express');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const schemas = require('../validators/auth.validators');

const router = express.Router();

router.post('/signup', authLimiter, validate(schemas.signup), controller.signup);
router.post('/login', authLimiter, validate(schemas.login), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
