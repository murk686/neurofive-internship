const express = require('express');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const { sendError } = require('./utils/response');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();

app.use(express.json());

// Serve uploaded files publicly at /uploads/:filename
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NeuroFive Backend API — Week 4 Task 7: File Upload & Storage',
    data: {
      endpoints: {
        auth: ['POST /api/auth/signup', 'POST /api/auth/login', 'GET /api/auth/me'],
        upload: [
          'POST   /api/upload/avatar    — upload profile picture (field: avatar)',
          'POST   /api/upload/document  — upload any file (field: document)',
          'GET    /api/upload/my-files  — list your uploaded files',
          'DELETE /api/upload/:fileId   — delete a file',
        ],
        files: ['GET /uploads/:filename — retrieve any uploaded file'],
      },
      limits: {
        maxSize: '5MB',
        allowedTypes: 'JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX',
        avatarTypes: 'JPEG, PNG, GIF, WEBP only',
      },
    },
    error: null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404));
app.use(errorHandler);

module.exports = app;
