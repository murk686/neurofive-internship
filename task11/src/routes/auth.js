const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { signupSchema, loginSchema } = require('../utils/validators');
const { signup, login, getMe } = require('../controllers/authController');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

module.exports = router;
