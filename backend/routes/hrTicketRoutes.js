const express = require('express');
const router  = express.Router();

const {
  getTickets, getTicketById, createTicket,
  updateTicket, deleteTicket, addComment,
} = require('../functions/hrTicketFunction');

const { userAuthorization, adminOnly } = require('../middleware/userAuthorization');

// All ticket routes are protected
router.use(userAuthorization);

// GET  /api/tickets          — employee: own | admin: all (?status=&priority=&employeeId=)
router.get('/', getTickets);

// GET  /api/tickets/:id      — employee: own | admin: any
router.get('/:id', getTicketById);

// POST /api/tickets          — employee creates ticket
router.post('/', createTicket);

// PUT  /api/tickets/:id      — admin updates status / assignee
router.put('/:id', adminOnly, updateTicket);

// POST /api/tickets/:id/comments — both employee and admin can comment
router.post('/:id/comments', addComment);

// DELETE /api/tickets/:id    — employee: own | admin: any
router.delete('/:id', deleteTicket);

module.exports = router;
