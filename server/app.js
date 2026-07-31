const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db'); // ensure DB connects and tables seed

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const instagramRoutes = require('./routes/instagramRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const billingRoutes = require('./routes/billingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const academicRoutes = require('./routes/academicRoutes');

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static documents uploaded by project members
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Map REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);

const fs = require('fs');

const distPath = path.join(__dirname, '../client/dist');
const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distPath);

if (isProduction) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  // General check endpoint in development
  app.get('/', (req, res) => {
    res.send('Project Management System API is running successfully.');
  });
}

// API 404 Route handler for unmapped REST endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API endpoint ${req.originalUrl} not found` });
});

// General 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: 'Requested resource not found' });
});

module.exports = app;
