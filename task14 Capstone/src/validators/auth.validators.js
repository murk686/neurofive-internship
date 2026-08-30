const { z } = require('zod');

const signup = {
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('Must be a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    role: z.enum(['attendee', 'organizer']).optional().default('attendee'),
  }),
};

const login = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Must be a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
};

module.exports = { signup, login };
