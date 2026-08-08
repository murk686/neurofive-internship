const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const { uploadAvatar, uploadDocument, getMyFiles, removeFile } = require('../controllers/uploadController');

// All upload routes require auth
router.post('/avatar', protect, handleUpload('avatar'), uploadAvatar);
router.post('/document', protect, handleUpload('document'), uploadDocument);
router.get('/my-files', protect, getMyFiles);
router.delete('/:fileId', protect, removeFile);

module.exports = router;
