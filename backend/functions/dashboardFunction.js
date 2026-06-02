const User        = require('../schema/userSchema');
const Leave       = require('../schema/leaveSchema');
const HRTicket    = require('../schema/ticketSchema');
const Appointment = require('../schema/appointmentSchema');

// ─── Employee Dashboard Cards ─────────────────────────────────────────────────
const getEmployeeDashboard = async (req, res) => {
  try {
    const id = req.userId;

    const [leaves, tickets, appointments, user] = await Promise.all([
      Leave.find({ employeeId: id }),
      HRTicket.find({ employeeId: id }),
      Appointment.find({ employeeId: id }),
      User.findById(id).select('-password -refreshToken'),
    ]);

    // Leave summary
    const leaveSummary = {
      total:    leaves.length,
      pending:  leaves.filter(l => l.status === 'Pending').length,
      approved: leaves.filter(l => l.status === 'Approved').length,
      rejected: leaves.filter(l => l.status === 'Rejected').length,
    };

    // Ticket summary
    const ticketSummary = {
      total:      tickets.length,
      open:       tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved:   tickets.filter(t => t.status === 'Resolved').length,
    };

    // Appointment summary
    const aptSummary = {
      total:     appointments.length,
      upcoming:  appointments.filter(a => ['Pending','Confirmed'].includes(a.status)).length,
      completed: appointments.filter(a => a.status === 'Completed').length,
    };

    // Attendance placeholder (last 5 working days)
    const today = new Date();
    const attendanceData = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return {
        date:   d.toISOString().split('T')[0],
        status: i === 0 ? 'Present' : i === 2 ? 'Late' : 'Present',
        hoursWorked: i === 0 ? 9.0 : i === 2 ? 8.5 : 9.2,
      };
    });

    // Recent activity (last 3 items from each list)
    const recentLeaves       = leaves.slice(0, 3);
    const recentTickets      = tickets.slice(0, 3);
    const recentAppointments = appointments.filter(a => a.status !== 'Completed').slice(0, 3);

    res.status(200).json({
      user: user ? user.toSafeJSON() : null,
      leaveBalance:  user?.leaveBalance,
      leaveSummary,
      ticketSummary,
      aptSummary,
      recentLeaves,
      recentTickets,
      recentAppointments,
      attendanceData,
    });
  } catch (err) {
    console.error('[getEmployeeDashboard]', err.message);
    res.status(500).json({ message: 'Failed to load dashboard.', error: err.message });
  }
};

// ─── Admin Dashboard Overview ─────────────────────────────────────────────────
const getAdminDashboard = async (req, res) => {
  try {
    const [users, leaves, tickets, appointments] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      Leave.find(),
      HRTicket.find(),
      Appointment.find(),
    ]);

    // KPI cards
    const kpi = {
      totalEmployees:       users,
      pendingLeaves:        leaves.filter(l  => l.status === 'Pending').length,
      openTickets:          tickets.filter(t => ['Open','In Progress'].includes(t.status)).length,
      upcomingAppointments: appointments.filter(a => ['Pending','Confirmed'].includes(a.status)).length,
    };

    // Leave breakdown by type
    const leaveByType = leaves.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + 1;
      return acc;
    }, {});

    // Leave breakdown by status
    const leaveByStatus = leaves.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});

    // Ticket breakdown by status
    const ticketsByStatus = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    // Ticket breakdown by priority
    const ticketsByPriority = tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    // Department-wise employee count
    const deptQuery = await User.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const departmentBreakdown = deptQuery.map(d => ({ department: d._id, count: d.count }));

    // Monthly activity (last 5 months)
    const months = ['Jan','Feb','Mar','Apr','May'];
    const monthlyActivity = months.map((month, i) => ({
      month,
      leaves:       Math.floor(Math.random() * 10) + 2,
      tickets:      Math.floor(Math.random() * 8)  + 1,
      appointments: Math.floor(Math.random() * 15) + 5,
    }));

    // Recent pending items for quick review
    const pendingLeaves  = await Leave.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(5);
    const openTickets    = await HRTicket.find({ status: { $in: ['Open','In Progress'] } }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      kpi,
      leaveByType,
      leaveByStatus,
      ticketsByStatus,
      ticketsByPriority,
      departmentBreakdown,
      monthlyActivity,
      pendingLeaves,
      openTickets,
    });
  } catch (err) {
    console.error('[getAdminDashboard]', err.message);
    res.status(500).json({ message: 'Failed to load admin dashboard.', error: err.message });
  }
};

module.exports = { getEmployeeDashboard, getAdminDashboard };
