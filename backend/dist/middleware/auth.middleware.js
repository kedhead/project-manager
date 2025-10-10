"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const auth_service_1 = require("../services/auth.service");
const errorHandler_1 = require("./errorHandler");
// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('No token provided. Please login.', 401);
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const payload = auth_service_1.AuthService.verifyAccessToken(token);
        // Attach user to request
        req.user = {
            userId: payload.userId,
            email: payload.email,
        };
        next();
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            next(error);
        }
        else {
            next(new errorHandler_1.AppError('Invalid or expired token. Please login again.', 401));
        }
    }
};
exports.authenticate = authenticate;
// Optional authentication (doesn't throw error if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = auth_service_1.AuthService.verifyAccessToken(token);
            req.user = {
                userId: payload.userId,
                email: payload.email,
            };
        }
        next();
    }
    catch (error) {
        // Continue without user if token is invalid
        next();
    }
};
exports.optionalAuth = optionalAuth;
exports.default = exports.authenticate;
//# sourceMappingURL=auth.middleware.js.map