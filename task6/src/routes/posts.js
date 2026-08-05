const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createPostSchema, updatePostSchema, createCommentSchema } = require('../validators/postValidators');
const { getAllPosts, getPostById, createNewPost, updateExistingPost, deleteExistingPost } = require('../controllers/postController');
const { getCommentsByPost, addComment, removeComment } = require('../controllers/commentController');

// Post routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.post('/', protect, validate(createPostSchema), createNewPost);
router.patch('/:id', protect, validate(updatePostSchema), updateExistingPost);
router.delete('/:id', protect, deleteExistingPost);

// Nested comment routes
router.get('/:id/comments', getCommentsByPost);
router.post('/:id/comments', protect, validate(createCommentSchema), addComment);
router.delete('/:postId/comments/:commentId', protect, removeComment);

module.exports = router;
