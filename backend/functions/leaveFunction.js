const Leave = require('../schema/leaveSchema');
const User  = require('../schema/userSchema');

// ─── Get Leaves ───────────────────────────────────────────────────────────────
const getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    // Employees only see their own leaves
    if (req.role === 'employee') {
      filter.employeeId = req.userId;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) filter.status = status;

    const leaves = await Leave.find(filter).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (err) {
    console.error('[getLeaves]', err.message);
    res.status(500).json({ message: 'Failed to fetch leaves.' });
  }
};

// ─── Get Leave by ID ──────────────────────────────────────────────────────────
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found.' });

    // Employees can only view their own
    if (req.role === 'employee' && leave.employeeId.toString() !== req.userId)
      return res.status(403).json({ message: 'Access denied.' });

    res.status(200).json(leave);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leave.' });
  }
};

// ─── Apply Leave ──────────────────────────────────────────────────────────────
const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason, department } = req.body;

    if (!type || !startDate || !endDate || !reason)
      return res.status(400).json({ message: 'type, startDate, endDate and reason are required.' });

    if (new Date(endDate) < new Date(startDate))
      return res.status(400).json({ message: 'endDate must be on or after startDate.' });

    // Fetch employee name from DB
    const employee = await User.findById(req.userId).select('name department');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const leave = await Leave.create({
      employeeId:   req.userId,
      employeeName: employee.name,
      department:   department || employee.department,
      type,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json({ message: 'Leave applied successfully.', leave });
  } catch (err) {
    console.error('[applyLeave]', err.message);
    res.status(500).json({ message: 'Failed to apply leave.', error: err.message });
  }
};

// ─── Review Leave (admin: approve / reject) ───────────────────────────────────
const reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['Approved', 'Rejected'].includes(status))
      return res.status(400).json({ message: 'status must be Approved or Rejected.' });

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found.' });
    if (leave.status !== 'Pending')
      return res.status(400).json({ message: `Leave is already ${leave.status}.` });

    leave.status     = status;
    leave.reviewedBy = req.user.name;
    leave.reviewNote = reviewNote || '';

    // Deduct balance if approved
    if (status === 'Approved') {
      const balanceField = {
        'Annual Leave':    'leaveBalance.annual',
        'Sick Leave':      'leaveBalance.sick',
        'Casual Leave':    'leaveBalance.casual',
        'Emergency Leave': 'leaveBalance.casual',
      }[leave.type];

      if (balanceField) {
        await User.findByIdAndUpdate(
          leave.employeeId,
          { $inc: { [balanceField]: -leave.days } }
        );
      }
    }

    await leave.save();
    res.status(200).json({ message: `Leave ${status.toLowerCase()} successfully.`, leave });
  } catch (err) {
    console.error('[reviewLeave]', err.message);
    res.status(500).json({ message: 'Failed to review leave.', error: err.message });
  }
};

// ─── Cancel Leave (employee cancels own pending leave) ────────────────────────
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found.' });

    if (req.role === 'employee' && leave.employeeId.toString() !== req.userId)
      return res.status(403).json({ message: 'Access denied.' });

    if (leave.status !== 'Pending')
      return res.status(400).json({ message: 'Only pending leaves can be cancelled.' });

    await leave.deleteOne();
    res.status(200).json({ message: 'Leave cancelled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel leave.' });
  }
};

module.exports = { getLeaves, getLeaveById, applyLeave, reviewLeave, cancelLeave };
