const express = require('express');
const router  = express.Router();

const { register, login, refreshToken, logout, getMe } = require('../functions/authenticationFunction');
const { userAuthorization } = require('../middleware/userAuthorization');

// POST /api/auth/register  — public
router.post('/register', register);

// POST /api/auth/login  — public
router.post('/login', login);

// POST /api/auth/refresh  — public (needs refresh token in body)
router.post('/refresh', refreshToken);

// POST /api/auth/logout  — protected
router.post('/logout', userAuthorization, logout);

// GET  /api/auth/me  — protected
router.get('/me', userAuthorization, getMe);

module.exports = router;
