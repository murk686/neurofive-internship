/**
 * Integration Tests — API Endpoints
 * Tests all endpoints via real HTTP requests using Supertest.
 * Each endpoint has a happy path + at least one failure case.
 */

process.env.JWT_SECRET = 'test_integration_secret';
process.env.JWT_EXPIRES_IN = '7d';

const request = require('supertest');
const app = require('../src/app');
const { clearUsers } = require('../src/config/db');

// Reset DB between test suites to avoid state bleed
beforeEach(() => clearUsers());

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
describe('GET / — Health Check', () => {

  test('✅ returns 200 with API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('docs');
  });

  test('❌ unknown route returns 404', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

});

// ─────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────
describe('POST /api/auth/signup', () => {

  const validUser = { username: 'murk', email: 'murk@test.com', password: 'secret123' };

  test('✅ creates account and returns token + user', async () => {
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.username).toBe('murk');
    expect(res.body.data.user.email).toBe('murk@test.com');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('❌ returns 400 on empty body', async () => {
    const res = await request(app).post('/api/auth/signup').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Request body cannot be empty');
  });

  test('❌ returns 422 when username is missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'murk@test.com', password: 'secret123' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.error).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'username' })
    ]));
  });

  test('❌ returns 422 with invalid email', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...validUser, email: 'notanemail' });
    expect(res.status).toBe(422);
    expect(res.body.error[0].field).toBe('email');
  });

  test('❌ returns 422 when password is too short', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...validUser, password: 'hi' });
    expect(res.status).toBe(422);
    expect(res.body.error[0].field).toBe('password');
  });

  test('❌ returns 409 on duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(validUser);
    const res = await request(app).post('/api/auth/signup').send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('❌ returns 400 on malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('Content-Type', 'application/json')
      .send('{ bad json }');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/malformed/i);
  });

});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  const user = { username: 'murk', email: 'murk@test.com', password: 'secret123' };

  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(user);
  });

  test('✅ returns 200 with token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(user.email);
  });

  test('❌ returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('❌ returns 401 on non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'secret123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('❌ returns 400 on empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('❌ returns 422 with invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'notanemail', password: 'secret123' });
    expect(res.status).toBe(422);
  });

});

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
describe('GET /api/auth/me', () => {

  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'murk', email: 'murk@test.com', password: 'secret123'
    });
    token = res.body.data.token;
  });

  test('✅ returns user profile with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('murk@test.com');
    expect(res.body.data).not.toHaveProperty('password');
  });

  test('❌ returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token missing/i);
  });

  test('❌ returns 401 with tampered token', async () => {
    const tampered = token.slice(0, -5) + 'XXXXX';
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  test('❌ returns 401 with malformed Authorization header', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'NotBearer token');
    expect(res.status).toBe(401);
  });

});
