/**
 * In-memory store — Users → Posts → Comments (one-to-many both ways)
 * Pre-seeded with 40 posts and 40 comments for pagination/filter demos.
 */

const users = [
  { id: 'u1', username: 'murk', email: 'murk@test.com', password: '$2a$12$placeholder', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'u2', username: 'alice', email: 'alice@test.com', password: '$2a$12$placeholder', createdAt: '2026-01-02T00:00:00.000Z' },
  { id: 'u3', username: 'bob', email: 'bob@test.com', password: '$2a$12$placeholder', createdAt: '2026-01-03T00:00:00.000Z' },
];

const categories = ['Technology', 'Science', 'Health', 'Business', 'Travel'];
const statuses = ['published', 'draft'];

const posts = Array.from({ length: 40 }, (_, i) => ({
  id: `p${i + 1}`,
  title: `Post ${i + 1}: ${['Introduction to Node.js', 'React Best Practices', 'Understanding JWT', 'REST API Design', 'Database Indexing', 'Docker Basics', 'CI/CD Pipelines', 'TypeScript Tips'][i % 8]}`,
  body: `This is the body of post ${i + 1}. It covers important concepts and best practices.`,
  category: categories[i % categories.length],
  status: statuses[i % 2],
  authorId: ['u1', 'u2', 'u3'][i % 3],
  views: Math.floor(Math.random() * 1000) + 10,
  createdAt: new Date(2026, 0, i + 1).toISOString(),
  updatedAt: new Date(2026, 0, i + 1).toISOString(),
}));

const comments = Array.from({ length: 40 }, (_, i) => ({
  id: `c${i + 1}`,
  body: `This is comment ${i + 1}. Great post, very informative!`,
  postId: `p${(i % 10) + 1}`,   // comments spread across first 10 posts
  authorId: ['u1', 'u2', 'u3'][i % 3],
  createdAt: new Date(2026, 0, i + 2).toISOString(),
}));

// --- User helpers ---
const findUserByEmail = (email) => users.find((u) => u.email === email.toLowerCase());
const findUserById = (id) => users.find((u) => u.id === id);
const createUser = (user) => { users.push(user); return user; };

// --- Post helpers ---
const findPostById = (id) => posts.find((p) => p.id === id);
const createPost = (post) => { posts.push(post); return post; };
const updatePost = (id, updates) => {
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() };
  return posts[idx];
};
const deletePost = (id) => {
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  posts.splice(idx, 1);
  return true;
};

// --- Comment helpers ---
const findCommentById = (id) => comments.find((c) => c.id === id);
const getCommentsByPostId = (postId) => comments.filter((c) => c.postId === postId);
const createComment = (comment) => { comments.push(comment); return comment; };
const deleteComment = (id) => {
  const idx = comments.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  comments.splice(idx, 1);
  return true;
};

module.exports = {
  users, posts, comments,
  findUserByEmail, findUserById, createUser,
  findPostById, createPost, updatePost, deletePost,
  findCommentById, getCommentsByPostId, createComment, deleteComment,
};
