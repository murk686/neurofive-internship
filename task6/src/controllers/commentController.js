const { findPostById, getCommentsByPostId, findCommentById, createComment, deleteComment, findUserById } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { paginate } = require('../utils/paginate');

// GET /api/posts/:id/comments
// Query: ?page=1&limit=5&sortBy=createdAt&order=desc&authorId=u1
const getCommentsByPost = (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);

    const { page = 1, limit = 5, order = 'desc', authorId } = req.query;

    let result = getCommentsByPostId(req.params.id);

    // Filter by author
    if (authorId) {
      result = result.filter((c) => c.authorId === authorId);
    }

    // Sort by createdAt
    const dir = order === 'asc' ? 1 : -1;
    result.sort((a, b) => (a.createdAt < b.createdAt ? -1 * dir : 1 * dir));

    // Paginate
    const { data, pagination } = paginate(result, page, limit);

    // Enrich with author
    const enriched = data.map((c) => {
      const author = findUserById(c.authorId);
      return { ...c, author: author ? { id: author.id, username: author.username } : null };
    });

    return sendSuccess(res, { comments: enriched, pagination });
  } catch (err) { next(err); }
};

// POST /api/posts/:id/comments
const addComment = (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);

    const newComment = createComment({
      id: `c${Date.now()}`,
      body: req.body.body,
      postId: req.params.id,
      authorId: req.user.id,
      createdAt: new Date().toISOString(),
    });

    const author = findUserById(req.user.id);
    return sendSuccess(res, { ...newComment, author: { id: author.id, username: author.username } }, 201, 'Comment added successfully');
  } catch (err) { next(err); }
};

// DELETE /api/posts/:postId/comments/:commentId
const removeComment = (req, res, next) => {
  try {
    const post = findPostById(req.params.postId);
    if (!post) throw new AppError('Post not found', 404);

    const comment = findCommentById(req.params.commentId);
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.authorId !== req.user.id) throw new AppError('You can only delete your own comments', 403);

    deleteComment(req.params.commentId);
    return sendSuccess(res, null, 200, 'Comment deleted successfully');
  } catch (err) { next(err); }
};

module.exports = { getCommentsByPost, addComment, removeComment };
