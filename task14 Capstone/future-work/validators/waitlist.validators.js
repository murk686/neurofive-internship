const { z } = require('zod');

const join = {
  params: z.object({ id: z.string().uuid('Invalid event id') }),
  body: z.object({
    seats: z.number().int().positive('Must request at least 1 seat').max(20),
  }),
};

const idParam = {
  params: z.object({ id: z.string().uuid('Invalid waitlist entry id') }),
};

const list = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
};

module.exports = { join, idParam, list };
