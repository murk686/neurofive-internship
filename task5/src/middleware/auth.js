const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Protects routes — verifies the Bearer token.
 * JWT errors bubble to the global errorHandler automatically.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing or malformed', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws on bad/expired token
  req.user = decoded;
  next();
};

module.exports = { protect };
