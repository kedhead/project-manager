import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  // Register new user
  static register = asyncHandler(async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { email, password, firstName, lastName } = req.body;

    // Register user
    const { user, accessToken, refreshToken } = await AuthService.register(
      email,
      password,
      firstName,
      lastName
    );

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
  static login = asyncHandler(async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { email, password } = req.body;

    // Login user
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);

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
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Refresh tokens
    const tokens = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: tokens,
    });
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const user = await AuthService.getUserById(userId);

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  });

  // Update user profile
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { firstName, lastName, email } = req.body;

    const user = await AuthService.updateProfile(userId, {
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
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400);
    }

    await AuthService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  });

  // Request password reset
  static requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const resetToken = await AuthService.requestPasswordReset(email);

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
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    await AuthService.resetPassword(token, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  });

  // Logout (client-side token removal, optional blacklist implementation)
  static logout = asyncHandler(async (req: Request, res: Response) => {
    // In a JWT-based system, logout is primarily client-side (remove token)
    // Optional: Implement token blacklist here if needed

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  });
}

export default AuthController;
