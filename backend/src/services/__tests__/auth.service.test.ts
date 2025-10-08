import AuthService from '../auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the database pool
jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import { pool } from '../../config/database';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashed = await AuthService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(password.length);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);

      const result = await AuthService.comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await bcrypt.hash(password, 10);

      const result = await AuthService.comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 1;
      const token = AuthService.generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(userId);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 1;
      const token = AuthService.generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
      expect(decoded.id).toBe(userId);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const userId = 1;
      const token = AuthService.generateAccessToken(userId);

      const decoded = AuthService.verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const userId = 1;
      const token = AuthService.generateRefreshToken(userId);

      const decoded = AuthService.verifyRefreshToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(userId);
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        AuthService.verifyRefreshToken(invalidToken);
      }).toThrow();
    });
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockUser = {
        id: 1,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        created_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const result = await AuthService.register(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName
      );

      expect(result).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
