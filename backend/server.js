require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

// ─── Route Imports ─────────────────────────────────────────
const authRoutes        = require('./routes/authenticationRoute');
const userRoutes        = require('./routes/userRoutes');
const leaveRoutes       = require('./routes/leaveRoutes');
const hrTicketRoutes    = require('./routes/hrTicketRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');

const app  = express();
const PORT = process.env.PORT || 9000;

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://main-project-6hns-59csa1g7k-arshad-arshas-projects.vercel.app',
  'https://careconnectad.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.netlify\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ─── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logger ───────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─────────────────────────────────────────────────────────
// ❌ REMOVED: connectDB function + middleware (THIS WAS THE BUG)
// ─────────────────────────────────────────────────────────

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/leaves',       leaveRoutes);
app.use('/api/tickets',      hrTicketRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard',    dashboardRoutes);

// ─── Static JSON Routes ───────────────────────────────────
const fs   = require('fs');
const path = require('path');

const getDB = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));

app.get('/api/counselors', (_req, res) => {
  const db = getDB();
  res.json(db.counselors || []);
});

app.get('/api/resources', (req, res) => {
  const db = getDB();
  let resources = db.resources || [];
  if (req.query.category) {
    resources = resources.filter(r => r.category === req.query.category);
  }
  res.json(resources);
});

app.get('/api/announcements', (_req, res) => {
  const db = getDB();
  res.json((db.announcements || []).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  ));
});

app.post('/api/announcements', (req, res) => {
  const db  = getDB();
  const ann = {
    id: `ann${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.announcements.push(ann);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(201).json(ann);
});

app.delete('/api/announcements/:id', (req, res) => {
  const db = getDB();
  db.announcements = db.announcements.filter(a => a.id !== req.params.id);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.json({ message: 'Deleted.' });
});

app.get('/api/attendance', (req, res) => {
  const db = getDB();
  let att  = db.attendance || [];
  if (req.query.employeeId) {
    att = att.filter(a => a.employeeId === req.query.employeeId);
  }
  res.json(att.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.get('/api/enums', (_req, res) => {
  res.json({
    appointmentTypes: ['Mental Wellness','Nutrition Counseling','Fitness Assessment','Stress Management','General Wellness'],
    appointmentModes: ['Video Call', 'In-Person', 'Phone Call'],
    leaveTypes: ['Annual Leave','Sick Leave','Casual Leave','Maternity Leave','Paternity Leave','Emergency Leave'],
    ticketCategories: ['Payroll','IT Support','Benefits','Onboarding','Policy Clarification','Workplace Issue','Other'],
    ticketPriorities: ['Low', 'Medium', 'High'],
    ticketStatuses: ['Open', 'In Progress', 'Resolved'],
    departments: ['IT','HR','Finance','Marketing','Operations','Administration'],
    roles: ['employee', 'admin'],
  });
});

// ─── Health ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:   'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    time:     new Date().toISOString(),
  });
});

// ─── Errors ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.'
  });
});

// ─── START SERVER (CORRECT WAY) ───────────────────────────
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 CareConnect API running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;


// require('dotenv').config();
// const express   = require('express');
// const mongoose  = require('mongoose');
// const cors      = require('cors');

// // ─── Route Imports ─────────────────────────────────────────────────────────────
// const authRoutes        = require('./routes/authenticationRoute');
// const userRoutes        = require('./routes/userRoutes');
// const leaveRoutes       = require('./routes/leaveRoutes');
// const hrTicketRoutes    = require('./routes/hrTicketRoutes');
// const appointmentRoutes = require('./routes/appointmentRoutes');
// const dashboardRoutes   = require('./routes/dashboardRoutes');

// const app  = express();
// const PORT = process.env.PORT || 9000;

// // const app  = express();
// // const PORT = process.env.PORT || 10000;

// // ─── CORS ──────────────────────────────────────────────────
// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://localhost:3000',
//   'https://main-project-6hns-59csa1g7k-arshad-arshas-projects.vercel.app',
//   'https://careconnectad.netlify.app'
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (
//       !origin ||
//       allowedOrigins.includes(origin) ||
//       /\.vercel\.app$/.test(origin) ||
//       /\.netlify\.app$/.test(origin)
//     ) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// // // ─── CORS ──────────────────────────────────────────────────────────────────────

// // const allowedOrigins = process.env.ALLOWED_ORIGINS
// //   ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
// //   : [
// //       'http://localhost:3000',
// //       'http://localhost:5173',
// //     ];

// // app.use(cors({
// //   origin: (origin, callback) => {
// //     // Allow requests with no origin (e.g. mobile apps, curl) and whitelisted origins
// //     if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   credentials: true,
// //   optionsSuccessStatus: 200
// // }));
// // app.use(cors({
// //   origin: (origin, callback) => {
// //     if (
// //       !origin ||
// //       allowedOrigins.includes(origin) ||
// //       /\.vercel\.app$/.test(origin) ||
// //       /\.netlify\.app$/.test(origin) // ✅ ADD THIS
// //     ) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   credentials: true,
// //   optionsSuccessStatus: 200
// // }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ─── Request Logger ────────────────────────────────────────────────────────────
// app.use((req, _res, next) => {
//   console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
//   next();
// });

// // ─── MongoDB Connection ────────────────────────────────────────────────────────
// let isConnected = false;

// const connectDB = async () => {
//   if (isConnected) return;
//   if (mongoose.connection.readyState === 1) {
//     isConnected = true;
//     return;
//   }
//   // await mongoose.connect(process.env.MONGO, { serverSelectionTimeoutMS: 5000 });
//   await mongoose.connect(process.env.MONGO_URI);
//   isConnected = true;
//   console.log('✅  MongoDB connected');
// };

// app.use(async (req, res, next) => {
//   try {
//     await connectDB();
//     next();
//   } catch (err) {
//     console.error('❌  MongoDB connection failed:', err.message);
//     res.status(503).json({ message: 'Database connection failed, please try again later.' });
//   }
// });

// // ─── API Routes ────────────────────────────────────────────────────────────────
// app.use('/api/auth',         authRoutes);
// app.use('/api/users',        userRoutes);
// app.use('/api/leaves',       leaveRoutes);
// app.use('/api/tickets',      hrTicketRoutes);
// app.use('/api/appointments', appointmentRoutes);
// app.use('/api/dashboard',    dashboardRoutes);

// // ─── Static / Reference Data Routes ───────────────────────────────────────────
// const fs   = require('fs');
// const path = require('path');
// const getDB = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));

// app.get('/api/counselors', (_req, res) => {
//   const db = getDB();
//   res.json(db.counselors || []);
// });

// app.get('/api/resources', (req, res) => {
//   const db = getDB();
//   let resources = db.resources || [];
//   if (req.query.category) resources = resources.filter(r => r.category === req.query.category);
//   res.json(resources);
// });

// app.get('/api/announcements', (_req, res) => {
//   const db = getDB();
//   res.json((db.announcements || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
// });

// app.post('/api/announcements', (req, res) => {
//   const db  = getDB();
//   const ann = { id: `ann${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
//   db.announcements.push(ann);
//   fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
//   res.status(201).json(ann);
// });

// app.delete('/api/announcements/:id', (req, res) => {
//   const db = getDB();
//   db.announcements = db.announcements.filter(a => a.id !== req.params.id);
//   fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
//   res.json({ message: 'Deleted.' });
// });

// app.get('/api/attendance', (req, res) => {
//   const db  = getDB();
//   let att   = db.attendance || [];
//   if (req.query.employeeId) att = att.filter(a => a.employeeId === req.query.employeeId);
//   res.json(att.sort((a, b) => new Date(b.date) - new Date(a.date)));
// });

// app.get('/api/enums', (_req, res) => {
//   res.json({
//     appointmentTypes: ['Mental Wellness','Nutrition Counseling','Fitness Assessment','Stress Management','General Wellness'],
//     appointmentModes: ['Video Call', 'In-Person', 'Phone Call'],
//     leaveTypes: ['Annual Leave','Sick Leave','Casual Leave','Maternity Leave','Paternity Leave','Emergency Leave'],
//     ticketCategories: ['Payroll','IT Support','Benefits','Onboarding','Policy Clarification','Workplace Issue','Other'],
//     ticketPriorities: ['Low', 'Medium', 'High'],
//     ticketStatuses: ['Open', 'In Progress', 'Resolved'],
//     departments: ['IT','HR','Finance','Marketing','Operations','Administration'],
//     roles: ['employee', 'admin'],
//   });
// });

// // ─── Health Check ──────────────────────────────────────────────────────────────
// app.get('/api/health', (_req, res) => {
//   res.json({
//     status:   'OK',
//     server:   'CareConnect API',
//     version:  '2.0.0',
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
//     time:     new Date().toISOString(),
//   });
// });

// // ─── 404 Handler ───────────────────────────────────────────────────────────────
// app.use((_req, res) => {
//   res.status(404).json({ message: 'Route not found.' });
// });

// // ─── Global Error Handler ──────────────────────────────────────────────────────
// app.use((err, _req, res, _next) => {
//   console.error('[GlobalError]', err.message);
//   const status = err.status || 500;
//   res.status(status).json({ message: err.message || 'Internal server error.' });
// });

// // ─── Start Server ─────────────────────────────────────────────────────────────
// app.listen(PORT, async () => {
//   try { await connectDB(); } catch (e) { /* middleware handles it */ }
//   console.log(`\n🚀  CareConnect API running on port ${PORT}`);
//   console.log(`    Health: http://localhost:${PORT}/api/health\n`);
// });

// module.exports = app;

// // require('dotenv').config();
// // const express  = require('express');
// // const mongoose = require('mongoose');
// // const cors     = require('cors');
// // const fs       = require('fs');
// // const path     = require('path');

// // // ─── Route Imports ─────────────────────────────────────────
// // const authRoutes        = require('./routes/authenticationRoute');
// // const userRoutes        = require('./routes/userRoutes');
// // const leaveRoutes       = require('./routes/leaveRoutes');
// // const hrTicketRoutes    = require('./routes/hrTicketRoutes');
// // const appointmentRoutes = require('./routes/appointmentRoutes');
// // const dashboardRoutes   = require('./routes/dashboardRoutes');

// // const app  = express();
// // const PORT = process.env.PORT || 10000;

// // // ─── CORS ──────────────────────────────────────────────────
// // const allowedOrigins = [
// //   'http://localhost:5173',
// //   'http://localhost:3000',
// //   'https://main-project-6hns-59csa1g7k-arshad-arshas-projects.vercel.app',
// //   'https://careconnectad.netlify.app'
// // ];

// // app.use(cors({
// //   origin: (origin, callback) => {
// //     if (
// //       !origin ||
// //       allowedOrigins.includes(origin) ||
// //       /\.vercel\.app$/.test(origin) ||
// //       /\.netlify\.app$/.test(origin)
// //     ) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   credentials: true
// // }));

// // // ─── Middleware ────────────────────────────────────────────
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // ─── Logger ────────────────────────────────────────────────
// // app.use((req, _res, next) => {
// //   console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
// //   next();
// // });

// // // ─── API Routes ────────────────────────────────────────────
// // app.use('/api/auth',         authRoutes);
// // app.use('/api/users',        userRoutes);
// // app.use('/api/leaves',       leaveRoutes);
// // app.use('/api/tickets',      hrTicketRoutes);
// // app.use('/api/appointments', appointmentRoutes);
// // app.use('/api/dashboard',    dashboardRoutes);

// // // ─── Static JSON (Temporary Data) ──────────────────────────
// // const getDB = () =>
// //   JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));

// // app.get('/api/counselors', (_req, res) => {
// //   const db = getDB();
// //   res.json(db.counselors || []);
// // });

// // app.get('/api/resources', (req, res) => {
// //   const db = getDB();
// //   let resources = db.resources || [];
// //   if (req.query.category) {
// //     resources = resources.filter(r => r.category === req.query.category);
// //   }
// //   res.json(resources);
// // });

// // app.get('/api/announcements', (_req, res) => {
// //   const db = getDB();
// //   res.json((db.announcements || []).sort(
// //     (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
// //   ));
// // });

// // app.post('/api/announcements', (req, res) => {
// //   const db  = getDB();
// //   const ann = {
// //     id: `ann${Date.now()}`,
// //     ...req.body,
// //     createdAt: new Date().toISOString(),
// //   };
// //   db.announcements.push(ann);
// //   fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
// //   res.status(201).json(ann);
// // });

// // app.delete('/api/announcements/:id', (req, res) => {
// //   const db = getDB();
// //   db.announcements = db.announcements.filter(a => a.id !== req.params.id);
// //   fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
// //   res.json({ message: 'Deleted.' });
// // });

// // app.get('/api/attendance', (req, res) => {
// //   const db  = getDB();
// //   let att   = db.attendance || [];
// //   if (req.query.employeeId) {
// //     att = att.filter(a => a.employeeId === req.query.employeeId);
// //   }
// //   res.json(att.sort((a, b) => new Date(b.date) - new Date(a.date)));
// // });

// // app.get('/api/enums', (_req, res) => {
// //   res.json({
// //     appointmentTypes: ['Mental Wellness','Nutrition Counseling','Fitness Assessment','Stress Management','General Wellness'],
// //     appointmentModes: ['Video Call', 'In-Person', 'Phone Call'],
// //     leaveTypes: ['Annual Leave','Sick Leave','Casual Leave','Maternity Leave','Paternity Leave','Emergency Leave'],
// //     ticketCategories: ['Payroll','IT Support','Benefits','Onboarding','Policy Clarification','Workplace Issue','Other'],
// //     ticketPriorities: ['Low', 'Medium', 'High'],
// //     ticketStatuses: ['Open', 'In Progress', 'Resolved'],
// //     departments: ['IT','HR','Finance','Marketing','Operations','Administration'],
// //     roles: ['employee', 'admin'],
// //   });
// // });

// // // ─── Health Check ──────────────────────────────────────────
// // app.get('/api/health', (_req, res) => {
// //   res.json({
// //     status:   'OK',
// //     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
// //     time:     new Date().toISOString(),
// //   });
// // });

// // // ─── Error Handlers ────────────────────────────────────────
// // app.use((_req, res) => {
// //   res.status(404).json({ message: 'Route not found.' });
// // });

// // app.use((err, _req, res, _next) => {
// //   console.error('[GlobalError]', err.message);
// //   res.status(err.status || 500).json({
// //     message: err.message || 'Internal server error.',
// //   });
// // });

// // // ─── START SERVER (FIXED) ──────────────────────────────────
// // const startServer = async () => {
// //   try {
// //     await mongoose.connect(process.env.MONGO_URI, {
// //       serverSelectionTimeoutMS: 30000,
// //     });

// //     console.log("✅ MongoDB connected");

// //     app.listen(PORT, () => {
// //       console.log(`🚀 CareConnect API running on port ${PORT}`);
// //     });

// //   } catch (err) {
// //     console.error("❌ DB connection failed:", err);
// //   }
// // };

// // startServer();

// // module.exports = app;
