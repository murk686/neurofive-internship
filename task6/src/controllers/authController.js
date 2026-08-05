const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, createUser } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

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
    const token = generateToken({ id: newUser.id, email: newUser.email });
    return sendSuccess(res, { token, user: { id: newUser.id, username: newUser.username, email: newUser.email } }, 201, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user) throw new AppError('Invalid email or password', 401);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);
    const token = generateToken({ id: user.id, email: user.email });
    return sendSuccess(res, { token, user: { id: user.id, username: user.username, email: user.email } }, 200, 'Logged in successfully');
  } catch (err) { next(err); }
};

const getMe = (req, res, next) => {
  try {
    const user = findUserById(req.user.id);
    if (!user) throw new AppError('User not found', 404);
    return sendSuccess(res, { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt });
  } catch (err) { next(err); }
};

module.exports = { signup, login, getMe };
