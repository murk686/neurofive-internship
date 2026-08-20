const jwt = require('jsonwebtoken');
const { findUserById } = require('../config/db');
const { AppError } = require('./errorHandler');

/**
 * protect — verifies JWT and attaches user to req
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing or malformed', 401));
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Attach fresh user from DB (so role changes take effect immediately)
  const user = findUserById(decoded.id);
  if (!user) return next(new AppError('User no longer exists', 401));

  req.user = user;
  next();
};

/**
 * restrictTo(...roles) — role guard, returns 403 Forbidden for wrong roles
 * Usage: router.delete('/users/:id', protect, restrictTo('admin'), handler)
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. This action requires one of the following roles: ${roles.join(', ')}`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, restrictTo };
