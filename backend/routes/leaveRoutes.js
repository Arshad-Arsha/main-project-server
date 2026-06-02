const express = require('express');
const router  = express.Router();

const {
  getLeaves, getLeaveById, applyLeave,
  reviewLeave, cancelLeave,
} = require('../functions/leaveFunction');

const { userAuthorization, adminOnly } = require('../middleware/userAuthorization');

// All leave routes are protected
router.use(userAuthorization);

// GET  /api/leaves        — employees: own | admin: all (filter by ?status=&employeeId=)
router.get('/', getLeaves);

// GET  /api/leaves/:id    — employee: own | admin: any
router.get('/:id', getLeaveById);

// POST /api/leaves        — employee applies for leave
router.post('/', applyLeave);

// PUT  /api/leaves/:id/review  — admin: approve or reject
router.put('/:id/review', adminOnly, reviewLeave);

// DELETE /api/leaves/:id — employee cancels own pending leave
router.delete('/:id', cancelLeave);

module.exports = router;
