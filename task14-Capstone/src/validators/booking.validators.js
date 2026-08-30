const { z } = require('zod');

const create = {
  params: z.object({ id: z.string().uuid('Invalid event id') }),
  body: z.object({
    seats: z.number().int().positive('Must book at least 1 seat').max(20, 'Max 20 seats per booking'),
  }),
};

const idParam = {
  params: z.object({ id: z.string().uuid('Invalid booking id') }),
};

const list = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.enum(['confirmed', 'cancelled']).optional(),
  }),
};

module.exports = { create, idParam, list };
