const ApiError = require('../utils/ApiError');

/**
 * Normalizes known Sequelize errors into ApiError so callers always get a
 * consistent { status, message, details } shape regardless of source.
 */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
    const message =
      err.name === 'SequelizeUniqueConstraintError'
        ? 'A record with this value already exists'
        : 'Validation failed';
    return new ApiError(409, message, details);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiError.badRequest('Invalid reference to a related resource');
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Invalid or expired token');
  }

  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON in request body');
  }

  return null;
}

// 404 handler - must be mounted after all routes.
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Final error handler - must be mounted last (4 args signals Express).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err) || err;
  const isOperational = normalized instanceof ApiError;

  const statusCode = isOperational ? normalized.statusCode : 500;
  const message = isOperational ? normalized.message : 'Something went wrong';

  if (!isOperational) {
    // Unexpected/programmer error - log full detail server-side, hide from client.
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
    ...(process.env.NODE_ENV === 'development' && !isOperational ? { stack: err.stack } : {}),
  });
};

module.exports = { errorHandler, notFound };
