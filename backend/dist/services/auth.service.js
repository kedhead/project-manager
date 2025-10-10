"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const config_1 = require("../config");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthService {
    // Hash password
    static async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt_1.default.hash(password, saltRounds);
    }
    // Compare password
    static async comparePassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    // Generate JWT access token
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
    }
    // Generate JWT refresh token
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn,
        });
    }
    // Verify access token
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        }
        catch (error) {
            throw new errorHandler_1.AppError('Invalid or expired token', 401);
        }
    }
    // Verify refresh token
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        }
        catch (error) {
            throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
        }
    }
    // Register new user
    static async register(email, password, firstName, lastName) {
        // Check if user already exists
        const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            throw new errorHandler_1.AppError('User with this email already exists', 409);
        }
        // Hash password
        const passwordHash = await this.hashPassword(password);
        // Create user
        const result = await (0, database_1.query)(`INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, is_active, created_at`, [email.toLowerCase(), passwordHash, firstName, lastName]);
        const user = result.rows[0];
        // Generate tokens
        const tokenPayload = { userId: user.id, email: user.email };
        const accessToken = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        // Update last login
        await (0, database_1.query)('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        return { user, accessToken, refreshToken };
    }
    // Login user
    static async login(email, password) {
        // Find user
        const result = await (0, database_1.query)(`SELECT id, email, password_hash, first_name, last_name, is_active, created_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`, [email.toLowerCase()]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        const user = result.rows[0];
        // Check if user is active
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is inactive. Please contact support.', 403);
        }
        // Verify password
        const isPasswordValid = await this.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError('Invalid email or password', 401);
        }
        // Generate tokens
        const tokenPayload = { userId: user.id, email: user.email };
        const accessToken = this.generateAccessToken(tokenPayload);
        const refreshToken = this.generateRefreshToken(tokenPayload);
        // Update last login
        await (0, database_1.query)('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, accessToken, refreshToken };
    }
    // Refresh access token
    static async refreshAccessToken(refreshToken) {
        // Verify refresh token
        const payload = this.verifyRefreshToken(refreshToken);
        // Check if user still exists and is active
        const result = await (0, database_1.query)('SELECT id, email, is_active FROM users WHERE id = $1 AND deleted_at IS NULL', [payload.userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const user = result.rows[0];
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is inactive', 403);
        }
        // Generate new tokens
        const tokenPayload = { userId: user.id, email: user.email };
        const newAccessToken = this.generateAccessToken(tokenPayload);
        const newRefreshToken = this.generateRefreshToken(tokenPayload);
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    // Get user by ID
    static async getUserById(userId) {
        const result = await (0, database_1.query)(`SELECT id, email, first_name, last_name, is_active, created_at, last_login
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`, [userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return result.rows[0];
    }
    // Update user profile
    static async updateProfile(userId, updates) {
        const { firstName, lastName, email } = updates;
        const updateFields = [];
        const values = [];
        let paramIndex = 1;
        if (firstName !== undefined) {
            updateFields.push(`first_name = $${paramIndex}`);
            values.push(firstName);
            paramIndex++;
        }
        if (lastName !== undefined) {
            updateFields.push(`last_name = $${paramIndex}`);
            values.push(lastName);
            paramIndex++;
        }
        if (email !== undefined) {
            // Check if email is already taken
            const existing = await (0, database_1.query)('SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL', [email.toLowerCase(), userId]);
            if (existing.rows.length > 0) {
                throw new errorHandler_1.AppError('Email is already taken', 409);
            }
            updateFields.push(`email = $${paramIndex}`);
            values.push(email.toLowerCase());
            paramIndex++;
        }
        if (updateFields.length === 0) {
            throw new errorHandler_1.AppError('No fields to update', 400);
        }
        updateFields.push(`updated_at = NOW()`);
        values.push(userId);
        const result = await (0, database_1.query)(`UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, email, first_name, last_name, is_active, created_at, last_login`, values);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return result.rows[0];
    }
    // Change password
    static async changePassword(userId, currentPassword, newPassword) {
        // Get user with password
        const result = await (0, database_1.query)('SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const user = result.rows[0];
        // Verify current password
        const isPasswordValid = await this.comparePassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError('Current password is incorrect', 401);
        }
        // Hash new password
        const newPasswordHash = await this.hashPassword(newPassword);
        // Update password
        await (0, database_1.query)('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);
    }
    // Request password reset (generates token - actual email sending will be in email service)
    static async requestPasswordReset(email) {
        const result = await (0, database_1.query)('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            // Don't reveal if user exists
            throw new errorHandler_1.AppError('If the email exists, a reset link will be sent', 200);
        }
        const user = result.rows[0];
        // Generate reset token (valid for 1 hour)
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'password_reset' }, config_1.config.jwt.secret, {
            expiresIn: '1h',
        });
        return resetToken;
    }
    // Reset password with token
    static async resetPassword(token, newPassword) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            if (decoded.type !== 'password_reset') {
                throw new errorHandler_1.AppError('Invalid reset token', 400);
            }
            // Hash new password
            const passwordHash = await this.hashPassword(newPassword);
            // Update password
            await (0, database_1.query)('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL', [passwordHash, decoded.userId]);
        }
        catch (error) {
            throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
//# sourceMappingURL=auth.service.js.map