const { posts, findPostById, createPost, updatePost, deletePost, findUserById } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { paginate } = require('../utils/paginate');

// GET /api/posts
// Query params: ?status=published&category=Technology&authorId=u1&sortBy=createdAt&order=desc&page=1&limit=10&search=node
const getAllPosts = (req, res, next) => {
  try {
    const { status, category, authorId, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10, search } = req.query;

    let result = [...posts];

    // --- Filtering ---
    if (status) {
      if (!['published', 'draft'].includes(status)) {
        throw new AppError('status must be "published" or "draft"', 400);
      }
      result = result.filter((p) => p.status === status);
    }
    if (category) {
      result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (authorId) {
      result = result.filter((p) => p.authorId === authorId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
    }

    // --- Sorting ---
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'views'];
    if (!allowedSortFields.includes(sortBy)) {
      throw new AppError(`sortBy must be one of: ${allowedSortFields.join(', ')}`, 400);
    }
    const dir = order === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * dir;
      if (a[sortBy] > b[sortBy]) return 1 * dir;
      return 0;
    });

    // --- Pagination ---
    const { data, pagination } = paginate(result, page, limit);

    // Enrich with author username
    const enriched = data.map((p) => {
      const author = findUserById(p.authorId);
      return { ...p, author: author ? { id: author.id, username: author.username } : null };
    });

    return sendSuccess(res, { posts: enriched, pagination });
  } catch (err) { next(err); }
};

// GET /api/posts/:id
const getPostById = (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    const author = findUserById(post.authorId);
    return sendSuccess(res, { ...post, author: author ? { id: author.id, username: author.username } : null });
  } catch (err) { next(err); }
};

// POST /api/posts
const createNewPost = (req, res, next) => {
  try {
    const { title, body, category, status = 'published' } = req.body;
    const newPost = createPost({
      id: `p${Date.now()}`,
      title, body, category, status,
      authorId: req.user.id,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return sendSuccess(res, newPost, 201, 'Post created successfully');
  } catch (err) { next(err); }
};

// PATCH /api/posts/:id
const updateExistingPost = (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    if (post.authorId !== req.user.id) throw new AppError('You can only edit your own posts', 403);
    const updated = updatePost(req.params.id, req.body);
    return sendSuccess(res, updated, 200, 'Post updated successfully');
  } catch (err) { next(err); }
};

// DELETE /api/posts/:id
const deleteExistingPost = (req, res, next) => {
  try {
    const post = findPostById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    if (post.authorId !== req.user.id) throw new AppError('You can only delete your own posts', 403);
    deletePost(req.params.id);
    return sendSuccess(res, null, 200, 'Post deleted successfully');
  } catch (err) { next(err); }
};

module.exports = { getAllPosts, getPostById, createNewPost, updateExistingPost, deleteExistingPost };
