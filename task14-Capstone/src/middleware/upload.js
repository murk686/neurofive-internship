const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// NOTE: Vercel's filesystem is read-only — disk storage is not supported
// in serverless deployments. Using memory storage here for demo/capstone
// purposes. For production, swap this for an S3-compatible storage engine
// (e.g. multer-s3) so uploads persist and are shared across instances.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(ApiError.badRequest('Only JPEG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = upload;