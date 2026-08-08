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

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') return sendError(res, 'File too large. Maximum size is 5MB', 400);
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return sendError(res, 'Unexpected field name in upload', 400);

  console.error('UNHANDLED ERROR:', err);
  return sendError(res, 'An internal server error occurred', 500);
};

module.exports = { AppError, errorHandler };
