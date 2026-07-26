const { sendError } = require('../utils/response');

/**
 * Custom error class for known, operational errors.
 * Throw this anywhere in your app instead of plain Error.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler — must be registered LAST in app.js.
 * Catches everything: validation errors, JWT errors, AppErrors, unknown crashes.
 * Never leaks stack traces to the client.
 */
const errorHandler = (err, req, res, next) => {
  // Malformed JSON body (e.g. { "name": ) 
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Malformed JSON in request body', 400);
  }

  // Known operational errors thrown with AppError
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // JWT-specific errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid or tampered token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired, please log in again', 401);
  }
  if (err.name === 'NotBeforeError') {
    return sendError(res, 'Token not yet active', 401);
  }

  // Unknown/unexpected errors — log internally, hide details from client
  console.error('UNHANDLED ERROR:', err);
  return sendError(res, 'An internal server error occurred', 500);
};

module.exports = { AppError, errorHandler };
