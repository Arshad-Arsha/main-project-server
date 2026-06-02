require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

// ─── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/authenticationRoute');
const userRoutes        = require('./routes/userRoutes');
const leaveRoutes       = require('./routes/leaveRoutes');
const hrTicketRoutes    = require('./routes/hrTicketRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');

const app  = express();
const PORT = process.env.PORT || 9000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow local dev, Vercel preview/production, and same-origin requests
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://main-project-one.vercel.app',
      'https://main-project-git-main-arshad-arshas-projects.vercel.app'
    ];
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev) ──────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── MongoDB Connection Middleware ─────────────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log('✅  MongoDB connected');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    throw err;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database connection failed, please try again later.' });
  }
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/leaves',       leaveRoutes);
app.use('/api/tickets',      hrTicketRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard',    dashboardRoutes);

// ─── Static / Reference Data Routes (from db.json seed data) ──────────────────
const fs   = require('fs');
const path = require('path');
const getDB = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));

// GET /api/counselors
app.get('/api/counselors', (_req, res) => {
  const db = getDB();
  res.json(db.counselors || []);
});

// GET /api/resources?category=
app.get('/api/resources', (req, res) => {
  const db = getDB();
  let resources = db.resources || [];
  if (req.query.category) resources = resources.filter(r => r.category === req.query.category);
  res.json(resources);
});

// GET /api/announcements
app.get('/api/announcements', (_req, res) => {
  const db = getDB();
  res.json((db.announcements || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/announcements  (admin)
app.post('/api/announcements', (req, res) => {
  const db  = getDB();
  const ann = { id: `ann${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  db.announcements.push(ann);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(201).json(ann);
});

// DELETE /api/announcements/:id  (admin)
app.delete('/api/announcements/:id', (req, res) => {
  const db = getDB();
  db.announcements = db.announcements.filter(a => a.id !== req.params.id);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.json({ message: 'Deleted.' });
});

// GET /api/attendance?employeeId=
app.get('/api/attendance', (req, res) => {
  const db  = getDB();
  let att   = db.attendance || [];
  if (req.query.employeeId) att = att.filter(a => a.employeeId === req.query.employeeId);
  res.json(att.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// ─── Enums / Reference Lists ──────────────────────────────────────────────────
app.get('/api/enums', (_req, res) => {
  res.json({
    appointmentTypes: [
      'Mental Wellness',
      'Nutrition Counseling',
      'Fitness Assessment',
      'Stress Management',
      'General Wellness',
    ],
    appointmentModes: ['Video Call', 'In-Person', 'Phone Call'],
    leaveTypes: [
      'Annual Leave',
      'Sick Leave',
      'Casual Leave',
      'Maternity Leave',
      'Paternity Leave',
      'Emergency Leave',
    ],
    ticketCategories: [
      'Payroll',
      'IT Support',
      'Benefits',
      'Onboarding',
      'Policy Clarification',
      'Workplace Issue',
      'Other',
    ],
    ticketPriorities: ['Low', 'Medium', 'High'],
    ticketStatuses: ['Open', 'In Progress', 'Resolved'],
    departments: ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Administration'],
    roles: ['employee', 'admin'],
  });
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:   'OK',
    server:   'CareConnect API',
    version:  '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    time:     new Date().toISOString(),
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err.message);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error.' });
});

// ─── Local Dev Server ─────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    // Optionally connect to DB on startup for faster initial local response
    try {
      await connectDB();
    } catch (e) {
      // Ignored here, middleware will catch it on first request
    }
    console.log('\n🚀  CareConnect API running');
    console.log(`    Local:  http://localhost:${PORT}`);
    console.log(`    Health: http://localhost:${PORT}/api/health\n`);
  });
}

// Export for Vercel serverless
module.exports = app;

