const { sendError } = require('../utils/response');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return sendError(res, 'Malformed JSON in request body', 400);
  if (err.isOperational) return sendError(res, err.message, err.statusCode);
  if (err.name === 'JsonWebTokenError') return sendError(res, 'Invalid or tampered token', 401);
  if (err.name === 'TokenExpiredError') return sendError(res, 'Token has expired', 401);
  console.error('UNHANDLED ERROR:', err);
  return sendError(res, 'An internal server error occurred', 500);
};

module.exports = { AppError, errorHandler };
