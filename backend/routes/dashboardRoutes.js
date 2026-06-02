const express = require('express');
const router  = express.Router();

const { getEmployeeDashboard, getAdminDashboard } = require('../functions/dashboardFunction');
const { userAuthorization, adminOnly } = require('../middleware/userAuthorization');

// All dashboard routes are protected
router.use(userAuthorization);

// GET /api/dashboard/employee — logged-in employee's dashboard cards
router.get('/employee', getEmployeeDashboard);

// GET /api/dashboard/admin   — admin-only analytics overview
router.get('/admin', adminOnly, getAdminDashboard);

module.exports = router;
