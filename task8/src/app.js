const express = require('express');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const postRoutes = require('./routes/posts');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NeuroFive Backend API — Week 4 Task 8: RBAC',
    data: {
      roles: ['admin', 'moderator', 'user'],
      endpoints: {
        auth: ['POST /api/auth/signup', 'POST /api/auth/login', 'GET /api/auth/me'],
        posts: ['GET /api/posts', 'POST /api/posts', 'DELETE /api/posts/:id'],
        admin: [
          'GET    /api/admin/users              — admin only',
          'PATCH  /api/admin/users/:id/role     — admin only',
          'PATCH  /api/admin/users/:id/deactivate — admin only',
          'DELETE /api/admin/users/:id          — admin only',
        ],
      },
      seedAccounts: {
        admin: { email: 'admin@test.com', password: 'secret123', role: 'admin' },
        moderator: { email: 'mod@test.com', password: 'secret123', role: 'moderator' },
        user: { email: 'user@test.com', password: 'secret123', role: 'user' },
      },
    },
    error: null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);

app.use((req, res) => sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404));
app.use(errorHandler);

module.exports = app;
