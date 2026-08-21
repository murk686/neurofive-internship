const { verifyToken } = require('../utils/token');
const { findUserById } = require('../config/db');
const { AppError } = require('./errorHandler');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing or malformed', 401));
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token, process.env.JWT_SECRET);
  const user = findUserById(decoded.id);
  if (!user) return next(new AppError('User no longer exists', 401));
  req.user = user;
  next();
};

module.exports = { protect };
