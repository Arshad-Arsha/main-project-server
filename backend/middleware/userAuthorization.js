const jwt = require('jsonwebtoken');
const User = require('../schema/userSchema');

/**
 * userAuthorization — protects any route that requires a logged-in user.
 * Expects:  Authorization: Bearer <accessToken>
 * Attaches: req.user  (full Mongoose document minus password)
 *           req.userId (string)
 *           req.role   ("employee" | "admin")
 */
const userAuthorization = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired. Please refresh.' });
      }
      return res.status(403).json({ message: 'Invalid token.' });
    }

    // Attach user info to request
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ message: 'User not found. Access denied.' });
    }

    req.user   = user;
    req.userId = user._id.toString();
    req.role   = user.role;

    next();
  } catch (error) {
    console.error('[userAuthorization]', error.message);
    res.status(500).json({ message: 'Authorization error.' });
  }
};

/**
 * adminOnly — must be used AFTER userAuthorization.
 * Blocks non-admin users from admin-only routes.
 */
const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

module.exports = { userAuthorization, adminOnly };
