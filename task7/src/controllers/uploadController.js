const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { findUserById, updateUser, createFile, findFileById, findFilesByUser, deleteFile } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { ALLOWED_IMAGE_TYPES } = require('../middleware/upload');

// Helper — build public URL for a file
const buildUrl = (req, filename) =>
  `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/uploads/${filename}`;

// POST /api/upload/avatar  — upload/replace profile picture (images only)
const uploadAvatar = (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded. Include a file with field name "avatar"', 400);
    }

    // Images only for avatars
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // delete the saved file
      return sendError(res, 'Avatar must be an image (JPEG, PNG, GIF, WEBP)', 415);
    }

    const user = findUserById(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    // Delete old avatar file if it exists
    if (user.avatar) {
      const oldFilename = user.avatar.split('/uploads/')[1];
      const oldPath = path.join(__dirname, '../uploads', oldFilename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = buildUrl(req, req.file.filename);
    updateUser(req.user.id, { avatar: avatarUrl });

    return sendSuccess(res, {
      avatarUrl,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    }, 200, 'Avatar uploaded successfully');
  } catch (err) { next(err); }
};

// POST /api/upload/document  — upload any allowed file, linked to user
const uploadDocument = (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded. Include a file with field name "document"', 400);
    }

    const fileUrl = buildUrl(req, req.file.filename);

    const newFile = createFile({
      id: uuidv4(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString(),
    });

    return sendSuccess(res, {
      file: {
        id: newFile.id,
        originalName: newFile.originalName,
        mimeType: newFile.mimeType,
        size: newFile.size,
        url: newFile.url,
        uploadedAt: newFile.uploadedAt,
      },
    }, 201, 'File uploaded successfully');
  } catch (err) { next(err); }
};

// GET /api/upload/my-files  — list all files uploaded by the current user
const getMyFiles = (req, res, next) => {
  try {
    const userFiles = findFilesByUser(req.user.id).map((f) => ({
      id: f.id,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      url: f.url,
      uploadedAt: f.uploadedAt,
    }));

    return sendSuccess(res, { total: userFiles.length, files: userFiles });
  } catch (err) { next(err); }
};

// DELETE /api/upload/:fileId  — delete a file (only owner can delete)
const removeFile = (req, res, next) => {
  try {
    const file = findFileById(req.params.fileId);
    if (!file) throw new AppError('File not found', 404);
    if (file.uploadedBy !== req.user.id) throw new AppError('You can only delete your own files', 403);

    // Delete from disk
    const filePath = path.join(__dirname, '../uploads', file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    deleteFile(req.params.fileId);
    return sendSuccess(res, null, 200, 'File deleted successfully');
  } catch (err) { next(err); }
};

module.exports = { uploadAvatar, uploadDocument, getMyFiles, removeFile };
