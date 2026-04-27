const express = require('express');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { AppError } = require('./utils/errors');

// Route imports
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const approvalRoutes = require('./routes/approval.routes');
const broadcastRoutes = require('./routes/broadcast.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/content', broadcastRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
  });

  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: `File size exceeds limit of ${config.upload.maxSize / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Unexpected errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`${config.app.name} v${config.app.version} running on port ${PORT}`);
});

module.exports = app;
