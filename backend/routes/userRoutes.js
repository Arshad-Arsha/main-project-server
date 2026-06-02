const express = require('express');
const router  = express.Router();

const {
  getAllUsers, getUserById, createUser,
  updateUser, deleteUser, updateLeaveBalance,
} = require('../functions/userFunction');

const { userAuthorization, adminOnly } = require('../middleware/userAuthorization');

// All user routes are protected
router.use(userAuthorization);

// GET  /api/users         — admin: all users | employee: forbidden
router.get('/', adminOnly, getAllUsers);

// GET  /api/users/:id     — admin: any user | employee: own profile only
router.get('/:id', getUserById);

// POST /api/users         — admin only (create employee account)
router.post('/', adminOnly, createUser);

// PUT  /api/users/:id     — admin: any | employee: own profile
router.put('/:id', updateUser);

// PATCH /api/users/:id/leave-balance  — admin only
router.patch('/:id/leave-balance', adminOnly, updateLeaveBalance);

// DELETE /api/users/:id  — admin only
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
