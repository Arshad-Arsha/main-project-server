const express = require('express');
const router  = express.Router();

const {
  getAppointments, getAppointmentById,
  bookAppointment, updateAppointment, cancelAppointment,
} = require('../functions/appointmentFunction');

const { userAuthorization, adminOnly } = require('../middleware/userAuthorization');

// All appointment routes are protected
router.use(userAuthorization);

// GET  /api/appointments          — employee: own | admin: all (?status=&employeeId=)
router.get('/', getAppointments);

// GET  /api/appointments/:id      — employee: own | admin: any
router.get('/:id', getAppointmentById);

// POST /api/appointments          — employee books appointment
router.post('/', bookAppointment);

// PUT  /api/appointments/:id      — admin updates status (Confirmed / Completed)
router.put('/:id', adminOnly, updateAppointment);

// DELETE /api/appointments/:id   — employee cancels own | admin cancels any
router.delete('/:id', cancelAppointment);

module.exports = router;
