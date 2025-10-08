import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.routes';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock the database and services
jest.mock('../../config/database');
jest.mock('../../services/auth.service');

import AuthService from '../../services/auth.service';

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          created_at: new Date(),
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (AuthService.register as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password, firstName, lastName
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      (AuthService.login as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password
        });

      expect(response.status).toBe(400);
    });
  });
});
