"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = __importDefault(require("./config/database"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const projects_routes_1 = __importDefault(require("./routes/projects.routes"));
const tasks_routes_1 = __importDefault(require("./routes/tasks.routes"));
const comments_routes_1 = __importDefault(require("./routes/comments.routes"));
const files_routes_1 = __importDefault(require("./routes/files.routes"));
const groups_routes_1 = __importDefault(require("./routes/groups.routes"));
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const PORT = config_1.config.port;
// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.frontendUrl,
    credentials: true,
}));
// Compression middleware
app.use((0, compression_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
app.use(logger_1.logger);
// Static files for uploads
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
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
const export_routes_1 = __importDefault(require("./routes/export.routes"));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/projects', projects_routes_1.default);
app.use('/api', tasks_routes_1.default); // Tasks routes include both /projects/:id/tasks and /tasks/:id
app.use('/api', comments_routes_1.default); // Comments routes include /tasks/:id/comments, /comments/:id, and activity
app.use('/api', files_routes_1.default); // Files routes include /tasks/:id/files, /files/:id, and storage
app.use('/api', groups_routes_1.default); // Groups routes include /projects/:id/groups and /groups/:id
app.use('/api', export_routes_1.default); // Export routes include /projects/:id/export/*
// TODO: Add remaining routes
// app.use('/api/notifications', notificationRoutes);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Start server
const startServer = async () => {
    try {
        // Test database connection
        await database_1.default.query('SELECT NOW()');
        console.log('✅ Database connection established');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${config_1.config.nodeEnv}`);
            console.log(`🔗 API: ${config_1.config.appUrl}`);
            console.log(`🌐 Frontend: ${config_1.config.frontendUrl}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map