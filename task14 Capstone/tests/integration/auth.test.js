const request = require('supertest');
const { app } = require('../helpers');

describe('Auth', () => {
  describe('POST /api/auth/signup', () => {
    it('creates a new account and returns a token', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'attendee',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com', role: 'attendee' });
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(typeof res.body.data.token).toBe('string');
    });

    it('rejects signup with an invalid email', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details[0].field).toBe('email');
    });

    it('rejects signup with a password shorter than 8 characters', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Jane Doe',
        email: 'jane2@example.com',
        password: 'short',
      });

      expect(res.status).toBe(400);
    });

    it('rejects duplicate email signup with 409', async () => {
      const payload = { name: 'Jane Doe', email: 'dupe@example.com', password: 'password123' };
      await request(app).post('/api/auth/signup').send(payload);
      const res = await request(app).post('/api/auth/signup').send(payload);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      await request(app).post('/api/auth/signup').send({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(typeof res.body.data.token).toBe('string');
    });

    it('rejects login with wrong password with 401', async () => {
      await request(app).post('/api/auth/signup').send({
        name: 'Login Test 2',
        email: 'login2@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login2@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('rejects login for a non-existent email with 401 (not 404, to avoid leaking which emails exist)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'doesnotexist@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the current user with a valid token', async () => {
      const signup = await request(app).post('/api/auth/signup').send({
        name: 'Me Test',
        email: 'me@example.com',
        password: 'password123',
      });
      const token = signup.body.data.token;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('me@example.com');
    });

    it('returns 401 with a malformed token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });
  });
});
