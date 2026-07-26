const { sendError } = require('../utils/response');

/**
 * Validation middleware factory.
 * Usage: router.post('/signup', validate(signupSchema), controller)
 *
 * Returns 400 on empty body, 422 with field-level details on schema failure.
 */
const validate = (schema) => (req, res, next) => {
  // Reject completely empty bodies
  if (!req.body || Object.keys(req.body).length === 0) {
    return sendError(res, 'Request body cannot be empty', 400);
  }

  const { error } = schema.validate(req.body, {
    abortEarly: false,   // collect ALL errors, not just the first one
    stripUnknown: true,  // silently drop unrecognised fields
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path[0] || 'unknown',
      message: d.message.replace(/['"]/g, ''),
    }));
    return sendError(res, 'Validation failed', 422, details);
  }

  next();
};

module.exports = validate;
