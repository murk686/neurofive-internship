const { getAllPosts, findPostById, createPost, deletePost, findUserById } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

// GET /api/posts — public
const listPosts = (req, res, next) => {
  try {
    const posts = getAllPosts().map((p) => {
      const author = findUserById(p.authorId);
      return { ...p, author: author ? { id: author.id, username: author.username, role: author.role } : null };
    });
    return sendSuccess(res, { total: posts.length, posts });
  } catch (err) { next(err); }
};

// POST /api/posts — any logged-in user
const createNewPost = (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) throw new AppError('Title and body are required', 400);
    const post = createPost({
      id: `p${Date.now()}`,
      title, body,
      authorId: req.user.id,
      createdAt: new Date().toISOString(),
    });
    return sendSuccess(res, post, 201, 'Post created successfully');
  } catch (err) { next(err); }
};

// DELETE /api/posts/:id
// - Admin/moderator: can delete ANY post
// - User: can only delete their OWN post
const removePost = (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);

    const isPrivileged = ['admin', 'moderator'].includes(req.user.role);
    const isOwner = post.authorId === req.user.id;

    if (!isPrivileged && !isOwner) {
      throw new AppError('You do not have permission to delete this post', 403);
    }

    deletePost(req.params.id);
    return sendSuccess(res, null, 200, 'Post deleted successfully');
  } catch (err) { next(err); }
};

module.exports = { listPosts, createNewPost, removePost };
