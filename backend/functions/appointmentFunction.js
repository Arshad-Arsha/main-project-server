const Appointment = require('../schema/appointmentSchema');
const User        = require('../schema/userSchema');

// ─── Get Appointments ─────────────────────────────────────────────────────────
const getAppointments = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (req.role === 'employee') {
      filter.employeeId = req.userId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.status(200).json(appointments);
  } catch (err) {
    console.error('[getAppointments]', err.message);
    res.status(500).json({ message: 'Failed to fetch appointments.' });
  }
};

// ─── Get Appointment by ID ────────────────────────────────────────────────────
const getAppointmentById = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' });

    if (req.role === 'employee' && apt.employeeId.toString() !== req.userId)
      return res.status(403).json({ message: 'Access denied.' });

    res.status(200).json(apt);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch appointment.' });
  }
};

// ─── Book Appointment ─────────────────────────────────────────────────────────
const bookAppointment = async (req, res) => {
  try {
    const { counselorName, counselorSpecialty, date, time, type, mode, notes } = req.body;

    if (!counselorName || !date || !time || !type || !mode)
      return res.status(400).json({ message: 'counselorName, date, time, type, and mode are required.' });

    if (isNaN(Date.parse(date)))
      return res.status(400).json({ message: 'date must be a valid date (YYYY-MM-DD).' });

    // Check for duplicate booking at same slot
    const conflict = await Appointment.findOne({
      counselorName,
      date,
      time,
      status: { $in: ['Pending', 'Confirmed'] },
    });
    if (conflict)
      return res.status(409).json({ message: 'This counselor slot is already booked. Please choose another time.' });

    const employee = await User.findById(req.userId).select('name');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const appointment = await Appointment.create({
      employeeId:         req.userId,
      employeeName:       employee.name,
      counselorName,
      counselorSpecialty: counselorSpecialty || '',
      date,
      time,
      type,
      mode,
      notes: notes || '',
    });

    res.status(201).json({ message: 'Appointment booked successfully.', appointment });
  } catch (err) {
    console.error('[bookAppointment]', err.message);
    res.status(500).json({ message: 'Failed to book appointment.', error: err.message });
  }
};

// ─── Update Appointment Status (admin) ───────────────────────────────────────
const updateAppointment = async (req, res) => {
  try {
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const { status } = req.body;

    if (status && !allowed.includes(status))
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });

    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!apt) return res.status(404).json({ message: 'Appointment not found.' });
    res.status(200).json({ message: 'Appointment updated.', appointment: apt });
  } catch (err) {
    console.error('[updateAppointment]', err.message);
    res.status(500).json({ message: 'Failed to update appointment.', error: err.message });
  }
};

// ─── Cancel Appointment ───────────────────────────────────────────────────────
const cancelAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ message: 'Appointment not found.' });

    if (req.role === 'employee' && apt.employeeId.toString() !== req.userId)
      return res.status(403).json({ message: 'Access denied.' });

    if (apt.status === 'Completed')
      return res.status(400).json({ message: 'Completed appointments cannot be cancelled.' });

    await apt.deleteOne();
    res.status(200).json({ message: 'Appointment cancelled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel appointment.' });
  }
};

module.exports = { getAppointments, getAppointmentById, bookAppointment, updateAppointment, cancelAppointment };
