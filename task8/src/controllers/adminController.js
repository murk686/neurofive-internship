const { users, findUserById, updateUser, deleteUser } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

const safeUser = (u) => ({ id: u.id, username: u.username, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt });

// GET /api/admin/users — admin only
const getAllUsers = (req, res, next) => {
  try {
    return sendSuccess(res, { total: users.length, users: users.map(safeUser) });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/role — admin only
const changeUserRole = (req, res, next) => {
  try {
    const { role } = req.body;
    const allowed = ['admin', 'moderator', 'user'];
    if (!allowed.includes(role)) throw new AppError(`Role must be one of: ${allowed.join(', ')}`, 400);

    const target = findUserById(req.params.id);
    if (!target) throw new AppError('User not found', 404);
    if (target.id === req.user.id) throw new AppError('You cannot change your own role', 400);

    const updated = updateUser(req.params.id, { role });
    return sendSuccess(res, safeUser(updated), 200, `Role updated to "${role}" successfully`);
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/deactivate — admin only
const deactivateUser = (req, res, next) => {
  try {
    const target = findUserById(req.params.id);
    if (!target) throw new AppError('User not found', 404);
    if (target.id === req.user.id) throw new AppError('You cannot deactivate your own account', 400);
    const updated = updateUser(req.params.id, { isActive: false });
    return sendSuccess(res, safeUser(updated), 200, 'User deactivated successfully');
  } catch (err) { next(err); }
};

// DELETE /api/admin/users/:id — admin only
const deleteUserById = (req, res, next) => {
  try {
    const target = findUserById(req.params.id);
    if (!target) throw new AppError('User not found', 404);
    if (target.id === req.user.id) throw new AppError('You cannot delete your own account', 400);
    deleteUser(req.params.id);
    return sendSuccess(res, null, 200, 'User deleted successfully');
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, changeUserRole, deactivateUser, deleteUserById };
