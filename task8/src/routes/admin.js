const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { getAllUsers, changeUserRole, deactivateUser, deleteUserById } = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, restrictTo('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/deactivate', deactivateUser);
router.delete('/users/:id', deleteUserById);

module.exports = router;
