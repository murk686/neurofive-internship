const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { listPosts, createNewPost, removePost } = require('../controllers/postController');

router.get('/', listPosts);
router.post('/', protect, createNewPost);
router.delete('/:id', protect, removePost);

module.exports = router;
