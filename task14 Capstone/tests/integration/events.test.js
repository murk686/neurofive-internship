const request = require('supertest');
const { app, createUser, createEvent } = require('../helpers');

describe('Events', () => {
  describe('POST /api/events (role-based access control)', () => {
    it('allows an organizer to create an event', async () => {
      const { token } = await createUser({ role: 'organizer' });
      const res = await createEvent(token, { title: 'Organizer Event' });

      expect(res.status).toBe(201);
      expect(res.body.data.event.title).toBe('Organizer Event');
      expect(res.body.data.event.seatsRemaining).toBe(res.body.data.event.capacity);
    });

    it('forbids an attendee from creating an event (403)', async () => {
      const { token } = await createUser({ role: 'attendee' });
      const res = await createEvent(token);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated event creation (401)', async () => {
      const res = await request(app).post('/api/events').send({ title: 'No Auth' });
      expect(res.status).toBe(401);
    });

    it('rejects an event where endTime is before startTime (validation)', async () => {
      const { token } = await createUser({ role: 'organizer' });
      const res = await createEvent(token, {
        startTime: new Date(Date.now() + 100000).toISOString(),
        endTime: new Date(Date.now() - 100000).toISOString(),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/events (pagination, filtering, search)', () => {
    it('lists published events with pagination metadata', async () => {
      const { token } = await createUser({ role: 'organizer' });
      await createEvent(token, { title: 'Event A', category: 'music' });
      await createEvent(token, { title: 'Event B', category: 'tech' });

      const res = await request(app).get('/api/events?page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(1);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
    });

    it('filters events by category', async () => {
      const { token } = await createUser({ role: 'organizer' });
      await createEvent(token, { title: 'Music Fest', category: 'music' });
      await createEvent(token, { title: 'Tech Conf', category: 'tech' });

      const res = await request(app).get('/api/events?category=music');

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(1);
      expect(res.body.data.events[0].title).toBe('Music Fest');
    });

    it('searches events by title/description text', async () => {
      const { token } = await createUser({ role: 'organizer' });
      await createEvent(token, { title: 'Jazz Night', description: 'live music' });
      await createEvent(token, { title: 'Startup Pitch', description: 'business' });

      const res = await request(app).get('/api/events?search=jazz');

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(1);
      expect(res.body.data.events[0].title).toBe('Jazz Night');
    });
  });

  describe('GET /api/events/:id', () => {
    it('returns a single event by id', async () => {
      const { token } = await createUser({ role: 'organizer' });
      const created = await createEvent(token, { title: 'Solo Event' });

      const res = await request(app).get(`/api/events/${created.body.data.event.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.event.title).toBe('Solo Event');
      expect(res.body.data.event.organizer).toHaveProperty('name');
    });

    it('returns 404 for a non-existent event id', async () => {
      const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('returns 400 for a malformed event id', async () => {
      const res = await request(app).get('/api/events/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/events/:id (ownership enforcement)', () => {
    it('allows the owning organizer to update their event', async () => {
      const { token } = await createUser({ role: 'organizer' });
      const created = await createEvent(token, { title: 'Original Title' });

      const res = await request(app)
        .put(`/api/events/${created.body.data.event.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.event.title).toBe('Updated Title');
    });

    it('forbids a different organizer from updating someone else\'s event (403)', async () => {
      const owner = await createUser({ role: 'organizer' });
      const intruder = await createUser({ role: 'organizer' });
      const created = await createEvent(owner.token, { title: 'Owned Event' });

      const res = await request(app)
        .put(`/api/events/${created.body.data.event.id}`)
        .set('Authorization', `Bearer ${intruder.token}`)
        .send({ title: 'Hijacked Title' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('allows the owning organizer to delete their event', async () => {
      const { token } = await createUser({ role: 'organizer' });
      const created = await createEvent(token);

      const res = await request(app)
        .delete(`/api/events/${created.body.data.event.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/api/events/${created.body.data.event.id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
