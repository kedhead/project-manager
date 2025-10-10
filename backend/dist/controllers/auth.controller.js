"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
// Register new user
AuthController.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const { email, password, firstName, lastName } = req.body;
    // Register user
    const { user, accessToken, refreshToken } = await auth_service_1.AuthService.register(email, password, firstName, lastName);
    res.status(201).json({
        status: 'success',
        data: {
            user,
            accessToken,
            refreshToken,
        },
    });
});
// Login user
AuthController.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Validate request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const { email, password } = req.body;
    // Login user
    const { user, accessToken, refreshToken } = await auth_service_1.AuthService.login(email, password);
    res.status(200).json({
        status: 'success',
        data: {
            user,
            accessToken,
            refreshToken,
        },
    });
});
// Refresh access token
AuthController.refresh = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errorHandler_1.AppError('Refresh token is required', 400);
    }
    // Refresh tokens
    const tokens = await auth_service_1.AuthService.refreshAccessToken(refreshToken);
    res.status(200).json({
        status: 'success',
        data: tokens,
    });
});
// Get current user profile
AuthController.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const user = await auth_service_1.AuthService.getUserById(userId);
    res.status(200).json({
        status: 'success',
        data: { user },
    });
});
// Update user profile
AuthController.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { firstName, lastName, email } = req.body;
    const user = await auth_service_1.AuthService.updateProfile(userId, {
        firstName,
        lastName,
        email,
    });
    res.status(200).json({
        status: 'success',
        data: { user },
    });
});
// Change password
AuthController.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new errorHandler_1.AppError('Current password and new password are required', 400);
    }
    if (newPassword.length < 8) {
        throw new errorHandler_1.AppError('New password must be at least 8 characters long', 400);
    }
    await auth_service_1.AuthService.changePassword(userId, currentPassword, newPassword);
    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
    });
});
// Request password reset
AuthController.requestPasswordReset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new errorHandler_1.AppError('Email is required', 400);
    }
    const resetToken = await auth_service_1.AuthService.requestPasswordReset(email);
    // TODO: Send email with reset link (will be implemented in email service)
    // For now, return token in response (remove in production)
    res.status(200).json({
        status: 'success',
        message: 'If the email exists, a reset link will be sent',
        // Remove token from response in production
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
});
// Reset password with token
AuthController.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        throw new errorHandler_1.AppError('Token and new password are required', 400);
    }
    if (newPassword.length < 8) {
        throw new errorHandler_1.AppError('Password must be at least 8 characters long', 400);
    }
    await auth_service_1.AuthService.resetPassword(token, newPassword);
    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
    });
});
// Logout (client-side token removal, optional blacklist implementation)
AuthController.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // In a JWT-based system, logout is primarily client-side (remove token)
    // Optional: Implement token blacklist here if needed
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
});
exports.default = AuthController;
//# sourceMappingURL=auth.controller.js.map