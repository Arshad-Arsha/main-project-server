const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../schema/userSchema');

// // ─── Helpers ────────────────────────────────────────────────────────────────
// const generateAccessToken = (user) =>
//   jwt.sign(
//     { id: user._id, role: user.role },
//     process.env.ACCESS_SECRET_KEY,
//     { expiresIn: '15m' }
//   );

// const generateRefreshToken = (user) =>
//   jwt.sign(
//     { id: user._id },
//     process.env.REFRESH_SECRET_KEY,
//     { expiresIn: '7d' }
//   );
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET, // ✅ Updated
    { expiresIn: '15m' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET, // ✅ Updated
    { expiresIn: '7d' }
  );
// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, password: hashed,
      role: role || 'employee',
      department: department || 'IT',
      phone: phone || '',
    });

    res.status(201).json({
      message: 'Registration successful.',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refreshToken to DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
};

// ─── Refresh Token ───────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token)
      return res.status(401).json({ message: 'Refresh token required.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_SECRET_KEY);
    } catch {
      return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token)
      return res.status(403).json({ message: 'Refresh token mismatch.' });

    const newAccess  = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user);
    user.refreshToken = newRefresh;
    await user.save();

    res.status(200).json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    console.error('[refreshToken]', err.message);
    res.status(500).json({ message: 'Token refresh failed.', error: err.message });
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) { user.refreshToken = null; await user.save(); }
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[logout]', err.message);
    res.status(500).json({ message: 'Logout failed.' });
  }
};

// ─── Get Current User (me) ───────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    res.status(200).json({ user: req.user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
