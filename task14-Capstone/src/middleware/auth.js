const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

/**
 * Requires a valid Bearer JWT. Attaches the authenticated user to req.user.
 */
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing');
  }

  const token = header.split(' ')[1];
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User for this token no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles. Must run after `authenticate`.
 * Usage: authorize('organizer')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires one of these roles: ${roles.join(', ')}`));
  }
  next();
};

module.exports = { authenticate, authorize };
