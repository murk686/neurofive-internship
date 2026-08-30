const request = require('supertest');
const app = require('../src/app');

const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

async function createUser({ role = 'attendee', name = 'Test User', password = 'password123' } = {}) {
  const email = uniqueEmail(role);
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name, email, password, role });
  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
}

async function createEvent(token, overrides = {}) {
  const payload = {
    title: 'Test Event',
    description: 'A test event',
    category: 'tech',
    location: 'Karachi',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    capacity: 10,
    price: 20,
    ...overrides,
  };
  const res = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  return res;
}

module.exports = { app, createUser, createEvent };
