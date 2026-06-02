const HRTicket = require('../schema/ticketSchema');
const User     = require('../schema/userSchema');

// ─── Get Tickets ──────────────────────────────────────────────────────────────
const getTickets = async (req, res) => {
  try {
    const { status, priority, employeeId } = req.query;
    const filter = {};

    // Employees only see their own tickets
    if (req.role === 'employee') {
      filter.employeeId = req.userId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    const tickets = await HRTicket.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err) {
    console.error('[getTickets]', err.message);
    res.status(500).json({ message: 'Failed to fetch tickets.' });
  }
};

// ─── Get Ticket by ID ─────────────────────────────────────────────────────────
const getTicketById = async (req, res) => {
  try {
    const ticket = await HRTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    if (req.role === 'employee' && ticket.employeeId.toString() !== req.userId)
      return res.status(403).json({ message: 'Access denied.' });

    res.status(200).json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ticket.' });
  }
};

// ─── Create Ticket ────────────────────────────────────────────────────────────
const createTicket = async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description)
      return res.status(400).json({ message: 'category, subject, and description are required.' });

    const employee = await User.findById(req.userId).select('name department');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const ticket = await HRTicket.create({
      employeeId:   req.userId,
      employeeName: employee.name,
      department:   employee.department,
      category,
      subject,
      description,
      priority: priority || 'Medium',
    });

    res.status(201).json({ message: 'Ticket created successfully.', ticket });
  } catch (err) {
    console.error('[createTicket]', err.message);
    res.status(500).json({ message: 'Failed to create ticket.', error: err.message });
  }
};

// ─── Update Ticket Status (admin) ─────────────────────────────────────────────
const updateTicket = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const allowed = ['Open', 'In Progress', 'Resolved'];

    if (status && !allowed.includes(status))
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });

    const ticket = await HRTicket.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(status && { status }), ...(assignedTo && { assignedTo }) } },
      { new: true, runValidators: true }
    );

    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.status(200).json({ message: 'Ticket updated.', ticket });
  } catch (err) {
    console.error('[updateTicket]', err.message);
    res.status(500).json({ message: 'Failed to update ticket.', error: err.message });
  }
};

// ─── Delete Ticket ────────────────────────────────────────────────────────────
const deleteTicket = async (req, res) => {
  try {
    const ticket = await HRTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    if (req.role === 'employee' && ticket.employeeId.toString() !== req.userId)
      return res.status(403).json({ message: 'Access denied.' });

    await ticket.deleteOne();
    res.status(200).json({ message: 'Ticket deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete ticket.' });
  }
};

// ─── Add Comment ──────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: 'Comment text is required.' });

    const ticket = await HRTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    ticket.comments.push({ author: req.user.name, text: text.trim() });

    // Auto-update status when admin replies
    if (req.role === 'admin' && ticket.status === 'Open') {
      ticket.status     = 'In Progress';
      ticket.assignedTo = req.user.name;
    }

    await ticket.save();
    res.status(200).json({ message: 'Comment added.', ticket });
  } catch (err) {
    console.error('[addComment]', err.message);
    res.status(500).json({ message: 'Failed to add comment.', error: err.message });
  }
};

module.exports = { getTickets, getTicketById, createTicket, updateTicket, deleteTicket, addComment };
