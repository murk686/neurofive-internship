const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../utils/response');

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Storage config — saves to src/uploads/ with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter — reject unsupported types immediately
const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`INVALID_FILE_TYPE:${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Wrapper to catch multer errors and return consistent response shape
const handleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (!err) return next();

    if (err.message && err.message.startsWith('INVALID_FILE_TYPE')) {
      const type = err.message.split(':')[1];
      return sendError(
        res,
        `File type "${type}" is not allowed. Accepted: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX`,
        415
      );
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum allowed size is 5MB', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, `Unexpected field. Use "${fieldName}" as the field name`, 400);
    }

    next(err);
  });
};

module.exports = { handleUpload, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES };
