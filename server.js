const express = require('express');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

// Import database and init
require('./database/init');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const exportRoutes = require('./routes/exportRoutes');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Recruiter Command Center',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/export', exportRoutes);

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Recruiter Command Center running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/?collegeId=1`);
});

module.exports = app;