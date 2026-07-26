const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { signupSchema, loginSchema } = require('../validators/authValidators');
const { signup, login, getMe } = require('../controllers/authController');

// Public routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);

// Protected route
router.get('/me', protect, getMe);

module.exports = router;
