const { sendError } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return sendError(res, 'Request body cannot be empty', 400);
  }
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path[0], message: d.message.replace(/['"]/g, '') }));
    return sendError(res, 'Validation failed', 422, details);
  }
  next();
};

module.exports = validate;
