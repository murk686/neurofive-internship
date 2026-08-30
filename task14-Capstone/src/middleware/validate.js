const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Validates req.body/query/params against a Zod schema shaped as
 * { body?, query?, params? }. On failure, forwards a 400 ApiError with
 * a field-level breakdown of what went wrong.
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    next(err);
  }
};

module.exports = validate;
