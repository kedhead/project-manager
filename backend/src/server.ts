import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { config } from './config';
import { logger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import pool from './config/database';
import authRoutes from './routes/auth.routes';
import projectsRoutes from './routes/projects.routes';
import tasksRoutes from './routes/tasks.routes';
import commentsRoutes from './routes/comments.routes';
import filesRoutes from './routes/files.routes';
import groupsRoutes from './routes/groups.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = config.port;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logger);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Project Manager API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      tasks: '/api/tasks',
      comments: '/api/comments',
      files: '/api/files',
      groups: '/api/groups',
      notifications: '/api/notifications',
    },
  });
});

// Import export routes
import exportRoutes from './routes/export.routes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api', tasksRoutes);  // Tasks routes include both /projects/:id/tasks and /tasks/:id
app.use('/api', commentsRoutes);  // Comments routes include /tasks/:id/comments, /comments/:id, and activity
app.use('/api', filesRoutes);  // Files routes include /tasks/:id/files, /files/:id, and storage
app.use('/api', groupsRoutes);  // Groups routes include /projects/:id/groups and /groups/:id
app.use('/api', exportRoutes);  // Export routes include /projects/:id/export/*
// TODO: Add remaining routes
// app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API: ${config.appUrl}`);
      console.log(`🌐 Frontend: ${config.frontendUrl}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

startServer();

export default app;
