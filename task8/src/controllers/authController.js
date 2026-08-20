const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, createUser } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const safeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

// POST /api/auth/signup
// Pass adminSecret matching ADMIN_SECRET env var to get admin role
const signup = async (req, res, next) => {
  try {
    const { username, email, password, adminSecret } = req.body;
    if (findUserByEmail(email)) throw new AppError('An account with this email already exists', 409);

    // Determine role
    let role = 'user';
    if (adminSecret) {
      if (adminSecret === process.env.ADMIN_SECRET) {
        role = 'admin';
      } else {
        throw new AppError('Invalid admin secret', 403);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = createUser({
      id: Date.now().toString(),
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const token = generateToken({ id: newUser.id });
    return sendSuccess(res, { token, user: safeUser(newUser) }, 201, 'Account created successfully');
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Your account has been deactivated', 403);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);
    const token = generateToken({ id: user.id });
    return sendSuccess(res, { token, user: safeUser(user) }, 200, 'Logged in successfully');
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = (req, res, next) => {
  try {
    return sendSuccess(res, safeUser(req.user));
  } catch (err) { next(err); }
};

module.exports = { signup, login, getMe };
