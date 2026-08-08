/**
 * In-memory store — Users + uploaded Files linked to users
 */

const users = [];
const files = [];

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

// File helpers
const createFile = (file) => { files.push(file); return file; };
const findFileById = (id) => files.find((f) => f.id === id);
const findFilesByUser = (userId) => files.filter((f) => f.uploadedBy === userId);
const deleteFile = (id) => {
  const idx = files.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  files.splice(idx, 1);
  return true;
};

module.exports = {
  users, files,
  findUserByEmail, findUserById, createUser, updateUser,
  createFile, findFileById, findFilesByUser, deleteFile,
};
