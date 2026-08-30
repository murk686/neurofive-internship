const { z } = require('zod');

const uuidParam = z.object({ id: z.string().uuid('Invalid event id') });

const dateString = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Must be a valid date' });

const create = {
  body: z
    .object({
      title: z.string().trim().min(3).max(200),
      description: z.string().trim().max(5000).optional(),
      category: z.string().trim().min(2).max(50),
      location: z.string().trim().min(2).max(200),
      startTime: dateString,
      endTime: dateString,
      capacity: z.number().int().positive('Capacity must be a positive integer'),
      price: z.number().nonnegative().optional().default(0),
      status: z.enum(['draft', 'published', 'cancelled']).optional().default('published'),
    })
    .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }),
};

const update = {
  params: uuidParam,
  body: z
    .object({
      title: z.string().trim().min(3).max(200).optional(),
      description: z.string().trim().max(5000).optional(),
      category: z.string().trim().min(2).max(50).optional(),
      location: z.string().trim().min(2).max(200).optional(),
      startTime: dateString.optional(),
      endTime: dateString.optional(),
      capacity: z.number().int().positive().optional(),
      price: z.number().nonnegative().optional(),
      status: z.enum(['draft', 'published', 'cancelled']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
};

const list = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    category: z.string().trim().optional(),
    location: z.string().trim().optional(),
    search: z.string().trim().optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    sortBy: z.enum(['startTime', 'price', 'createdAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
};

const idParam = { params: uuidParam };

module.exports = { create, update, list, idParam };
