const express = require('express');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NeuroFive Backend API — Week 3 Task 6',
    data: {
      endpoints: {
        auth: [
          'POST /api/auth/signup',
          'POST /api/auth/login',
          'GET  /api/auth/me',
        ],
        posts: [
          'GET    /api/posts?status=&category=&authorId=&search=&sortBy=&order=&page=&limit=',
          'GET    /api/posts/:id',
          'POST   /api/posts',
          'PATCH  /api/posts/:id',
          'DELETE /api/posts/:id',
        ],
        comments: [
          'GET    /api/posts/:id/comments?page=&limit=&order=&authorId=',
          'POST   /api/posts/:id/comments',
          'DELETE /api/posts/:postId/comments/:commentId',
        ],
      },
    },
    error: null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.use((req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

app.use(errorHandler);

module.exports = app;
