const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, createUser } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const safeUser = (u) => ({ id: u.id, username: u.username, email: u.email, createdAt: u.createdAt });

const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (findUserByEmail(email)) throw new AppError('An account with this email already exists', 409);
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = createUser({
      id: Date.now().toString(),
      username, email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });
    logger.info(`New user registered: ${newUser.email}`);
    const token = generateToken({ id: newUser.id });
    return sendSuccess(res, { token, user: safeUser(newUser) }, 201, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Failed login attempt for: ${email}`);
      throw new AppError('Invalid email or password', 401);
    }
    logger.info(`User logged in: ${email}`);
    const token = generateToken({ id: user.id });
    return sendSuccess(res, { token, user: safeUser(user) }, 200, 'Logged in successfully');
  } catch (err) { next(err); }
};

const getMe = (req, res, next) => {
  try {
    return sendSuccess(res, safeUser(req.user));
  } catch (err) { next(err); }
};

module.exports = { signup, login, getMe };
