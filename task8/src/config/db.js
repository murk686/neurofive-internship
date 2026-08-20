/**
 * Roles: 'admin' | 'moderator' | 'user'
 *
 * Seeded accounts (passwords all = "secret123"):
 *   admin@test.com   → role: admin
 *   mod@test.com     → role: moderator
 *   user@test.com    → role: user
 *
 * Passwords are pre-hashed with bcrypt rounds=12.
 * Use signup endpoint to create fresh accounts,
 * or login with these seeded ones directly.
 */

const users = [
  {
    id: 'u1',
    username: 'adminmurk',
    email: 'admin@test.com',
    // bcrypt hash of "secret123"
    password: '$2b$12$rUgembpCDntjDDOnFSzCFOkJaa9xnaOzOb2mPArcnkr2aqbH1FGGq',
    role: 'admin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u2',
    username: 'modmurk',
    email: 'mod@test.com',
    password: '$2a$12$KIp4VC4GC9aKQCDf9mWzwOoHMv0SxlGFVvv7sQ3.eEpHPeXFZjEAy',
    role: 'moderator',
    isActive: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'u3',
    username: 'regularuser',
    email: 'user@test.com',
    password: '$2a$12$KIp4VC4GC9aKQCDf9mWzwOoHMv0SxlGFVvv7sQ3.eEpHPeXFZjEAy',
    role: 'user',
    isActive: true,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

const posts = [
  { id: 'p1', title: 'Admin Post', body: 'Written by admin', authorId: 'u1', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'p2', title: 'User Post', body: 'Written by regular user', authorId: 'u3', createdAt: '2026-01-02T00:00:00.000Z' },
  { id: 'p3', title: 'Another User Post', body: 'Also by regular user', authorId: 'u3', createdAt: '2026-01-03T00:00:00.000Z' },
];

// User helpers
const findUserByEmail = (email) => users.find((u) => u.email === email.toLowerCase());
const findUserById = (id) => users.find((u) => u.id === id);
const createUser = (user) => { users.push(user); return user; };
const updateUser = (id, updates) => {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  return users[idx];
};
const deleteUser = (id) => {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
};

// Post helpers
const findPostById = (id) => posts.find((p) => p.id === id);
const getAllPosts = () => [...posts];
const createPost = (post) => { posts.push(post); return post; };
const deletePost = (id) => {
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  posts.splice(idx, 1);
  return true;
};

module.exports = {
  users, posts,
  findUserByEmail, findUserById, createUser, updateUser, deleteUser,
  findPostById, getAllPosts, createPost, deletePost,
};
