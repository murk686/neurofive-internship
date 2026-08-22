const users = [];
const findUserByEmail = (email) => users.find((u) => u.email === email.toLowerCase());
const findUserById = (id) => users.find((u) => u.id === id);
const createUser = (user) => { users.push(user); return user; };
module.exports = { users, findUserByEmail, findUserById, createUser };
