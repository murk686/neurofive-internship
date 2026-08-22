const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  // Log all errors through winston
  if (err.isOperational) {
    logger.warn(`[${err.statusCode}] ${err.message} — ${req.method} ${req.originalUrl}`);
  } else {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, { error: err.message, stack: err.stack });
  }

  if (err.type === 'entity.parse.failed') return sendError(res, 'Malformed JSON in request body', 400);
  if (err.isOperational) return sendError(res, err.message, err.statusCode);
  if (err.name === 'JsonWebTokenError') return sendError(res, 'Invalid or tampered token', 401);
  if (err.name === 'TokenExpiredError') return sendError(res, 'Token has expired', 401);

  return sendError(res, 'An internal server error occurred', 500);
};

module.exports = { AppError, errorHandler };
