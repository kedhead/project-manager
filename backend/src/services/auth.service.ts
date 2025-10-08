import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: Date;
}

interface TokenPayload {
  userId: number;
  email: string;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT access token
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  // Generate JWT refresh token
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  // Verify access token
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  // Register new user
  static async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, is_active, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Generate tokens
    const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    return { user, accessToken, refreshToken };
  }

  // Login user
  static async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'password_hash'>; accessToken: string; refreshToken: string }> {
    // Find user
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, is_active, created_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is inactive. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if user still exists and is active
    const result = await query(
      'SELECT id, email, is_active FROM users WHERE id = $1 AND deleted_at IS NULL',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is inactive', 403);
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = this.generateAccessToken(tokenPayload);
    const newRefreshToken = this.generateRefreshToken(tokenPayload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Get user by ID
  static async getUserById(userId: number): Promise<Omit<User, 'password_hash'>> {
    const result = await query(
      `SELECT id, email, first_name, last_name, is_active, created_at, last_login
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  }

  // Update user profile
  static async updateProfile(
    userId: number,
    updates: { firstName?: string; lastName?: string; email?: string }
  ): Promise<Omit<User, 'password_hash'>> {
    const { firstName, lastName, email } = updates;
    const updateFields: string[] = [];
    const values: any[] = [];
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
      const existing = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL',
        [email.toLowerCase(), userId]
      );

      if (existing.rows.length > 0) {
        throw new AppError('Email is already taken', 409);
      }

      updateFields.push(`email = $${paramIndex}`);
      values.push(email.toLowerCase());
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, email, first_name, last_name, is_active, created_at, last_login`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  }

  // Change password
  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    // Verify current password
    const isPasswordValid = await this.comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );
  }

  // Request password reset (generates token - actual email sending will be in email service)
  static async requestPasswordReset(email: string): Promise<string> {
    const result = await query(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if user exists
      throw new AppError('If the email exists, a reset link will be sent', 200);
    }

    const user = result.rows[0];

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ userId: user.id, type: 'password_reset' }, config.jwt.secret, {
      expiresIn: '1h',
    });

    return resetToken;
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: number; type: string };

      if (decoded.type !== 'password_reset') {
        throw new AppError('Invalid reset token', 400);
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL',
        [passwordHash, decoded.userId]
      );
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }
  }
}

export default AuthService;
