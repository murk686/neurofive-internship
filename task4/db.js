/**
 * db.js — In-memory "database"
 *
 * In a real app this would be MongoDB, PostgreSQL, etc.
 * For this task we use a plain array so you can focus on
 * auth logic without database setup noise.
 *
 * Structure of each user object:
 *   { id, email, passwordHash, name, createdAt }
 */

const users = [];
let nextId = 1;

module.exports = {
  /**
   * Find a user by email. Returns the user object or undefined.
   */
  findByEmail(email) {
    return users.find((u) => u.email === email.toLowerCase());
  },

  /**
   * Find a user by their numeric ID. Returns the user or undefined.
   */
  findById(id) {
    return users.find((u) => u.id === id);
  },

  /**
   * Insert a new user. Returns the saved user (without passwordHash).
   */
  createUser({ email, passwordHash, name }) {
    const user = {
      id: nextId++,
      email: email.toLowerCase(),
      passwordHash, // hashed — NEVER the plain-text password
      name,
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    // Return a safe copy — never expose passwordHash to callers
    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Expose the full user record (including hash) only for internal auth checks.
   */
  findByEmailWithHash(email) {
    return users.find((u) => u.email === email.toLowerCase());
  },
};
