const bcrypt = require('bcryptjs');
const User = require('../schema/userSchema');

// ─── Get all users (admin) ───────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { department, role, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (role)       filter.role = role;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error('[getAllUsers]', err.message);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// ─── Get single user ─────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
};

// ─── Create user (admin) ─────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role, department, phone });
    res.status(201).json({ message: 'User created.', user: user.toSafeJSON() });
  } catch (err) {
    console.error('[createUser]', err.message);
    res.status(500).json({ message: 'Failed to create user.', error: err.message });
  }
};

// ─── Update user ─────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;

    // Only admins can change someone else's role
    if (rest.role && req.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can change roles.' });

    const update = { ...rest };
    if (password) update.password = await bcrypt.hash(password, 12);

    // Regenerate avatar if name changes
    if (rest.name) {
      update.avatar = rest.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User updated.', user });
  } catch (err) {
    console.error('[updateUser]', err.message);
    res.status(500).json({ message: 'Failed to update user.', error: err.message });
  }
};

// ─── Delete user (admin) ─────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.userId)
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

// ─── Update leave balance (admin) ────────────────────────────────────────────
const updateLeaveBalance = async (req, res) => {
  try {
    const { annual, sick, casual } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { 'leaveBalance.annual': annual, 'leaveBalance.sick': sick, 'leaveBalance.casual': casual } },
      { new: true }
    ).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'Leave balance updated.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update leave balance.' });
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, updateLeaveBalance };
