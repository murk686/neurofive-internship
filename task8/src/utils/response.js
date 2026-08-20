const sendSuccess = (res, data, statusCode = 200, message = 'Success') => {
  return res.status(statusCode).json({ success: true, message, data, error: null });
};

const sendError = (res, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({ success: false, message, data: null, error: details });
};

module.exports = { sendSuccess, sendError };
