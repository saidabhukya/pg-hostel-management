const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const db = require('./config/db');
const { createTables } = require('./database/init');

// Route Handlers
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const roomRoutes = require('./routes/rooms');
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const complaintRoutes = require('./routes/complaints');
const visitorRoutes = require('./routes/visitors');
const messRoutes = require('./routes/mess');
const expenseRoutes = require('./routes/expenses');
const reportRoutes = require('./routes/reports');
const announcementRoutes = require('./routes/announcements');
const leaveRequestRoutes = require('./routes/leaveRequests');
const notificationRoutes = require('./routes/notifications');
const aiAssistantRoutes = require('./routes/aiAssistant');
const settingRoutes = require('./routes/settings');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets (uploads and frontend public folder)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/settings', settingRoutes);

// Health check endpoint with database status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await db.query('SELECT 1');
  } catch (e) {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'online',
    appName: config.hostel.name,
    database: {
      client: db.getActiveClient(),
      status: dbStatus,
      host: config.db.host
    },
    timestamp: new Date().toISOString()
  });
});

// SPA catch-all (serves index.html for frontend routing)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: config.env === 'development' ? err.stack : undefined
  });
});

// Start server
async function startServer() {
  try {
    // 1. Initialize DB connection
    await db.initDatabase();

    // 2. Automatically verify tables and seed initial structure if fresh database
    await createTables();

    // 3. Start listening on configured port
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` 🏢 ${config.hostel.name.toUpperCase()} (Online Web Application)`);
      console.log(` 🌐 Database: ${db.getActiveClient().toUpperCase()} (${config.db.host})`);
      console.log(` 🚀 Listening on: http://0.0.0.0:${config.port}`);
      console.log(` 🔑 Admin Login: admin / admin123`);
      console.log(`====================================================`);
    });

    server.on('error', (err) => {
      console.error('[Server Listen Error]', err.message);
    });

    // Also attempt listening on port 3000 if different and available for developer convenience
    if (config.port !== 3000) {
      try {
        const altServer = app.listen(3000, '0.0.0.0', () => {
          console.log(` 🚀 Secondary Port Active: http://0.0.0.0:3000`);
        });
        altServer.on('error', () => {
          // Port 3000 in use, primary port is still active
        });
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
