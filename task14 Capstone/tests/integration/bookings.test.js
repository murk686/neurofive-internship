const request = require('supertest');
const { app, createUser, createEvent } = require('../helpers');

describe('Bookings', () => {
  describe('POST /api/events/:id/bookings', () => {
    it('allows an authenticated user to book seats', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 5, price: 10 });

      const res = await request(app)
        .post(`/api/events/${event.body.data.event.id}/bookings`)
        .set('Authorization', `Bearer ${attendee.token}`)
        .send({ seats: 2 });

      expect(res.status).toBe(201);
      expect(res.body.data.booking).toMatchObject({ seats: 2, status: 'confirmed' });
      expect(Number(res.body.data.booking.totalPrice)).toBe(20);
    });

    it('rejects booking with 401 when unauthenticated', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const event = await createEvent(organizer.token);

      const res = await request(app)
        .post(`/api/events/${event.body.data.event.id}/bookings`)
        .send({ seats: 1 });

      expect(res.status).toBe(401);
    });

    it('rejects booking more seats than remain (409)', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 1 });

      const res = await request(app)
        .post(`/api/events/${event.body.data.event.id}/bookings`)
        .set('Authorization', `Bearer ${attendee.token}`)
        .send({ seats: 2 });

      expect(res.status).toBe(409);
    });

    it('never oversells seats under concurrent booking requests', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 3 });
      const eventId = event.body.data.event.id;

      // Fire 10 concurrent requests for 1 seat each against a capacity of 3.
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post(`/api/events/${eventId}/bookings`)
          .set('Authorization', `Bearer ${attendee.token}`)
          .send({ seats: 1 })
      );

      const results = await Promise.all(requests);
      const succeeded = results.filter((r) => r.status === 201);
      const rejected = results.filter((r) => r.status === 409);

      expect(succeeded).toHaveLength(3);
      expect(rejected).toHaveLength(7);

      const eventCheck = await request(app).get(`/api/events/${eventId}`);
      expect(eventCheck.body.data.event.seatsRemaining).toBe(0);
    });
  });

  describe('GET /api/bookings/me', () => {
    it("returns only the authenticated user's own bookings", async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendeeA = await createUser({ role: 'attendee' });
      const attendeeB = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 10 });
      const eventId = event.body.data.event.id;

      await request(app)
        .post(`/api/events/${eventId}/bookings`)
        .set('Authorization', `Bearer ${attendeeA.token}`)
        .send({ seats: 1 });
      await request(app)
        .post(`/api/events/${eventId}/bookings`)
        .set('Authorization', `Bearer ${attendeeB.token}`)
        .send({ seats: 2 });

      const res = await request(app)
        .get('/api/bookings/me')
        .set('Authorization', `Bearer ${attendeeA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings).toHaveLength(1);
      expect(res.body.data.bookings[0].seats).toBe(1);
    });
  });

  describe('DELETE /api/bookings/:id (cancellation restores seats)', () => {
    it('cancels a booking and restores seats to the event', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 5 });
      const eventId = event.body.data.event.id;

      const booking = await request(app)
        .post(`/api/events/${eventId}/bookings`)
        .set('Authorization', `Bearer ${attendee.token}`)
        .send({ seats: 3 });

      let eventCheck = await request(app).get(`/api/events/${eventId}`);
      expect(eventCheck.body.data.event.seatsRemaining).toBe(2);

      const cancelRes = await request(app)
        .delete(`/api/bookings/${booking.body.data.booking.id}`)
        .set('Authorization', `Bearer ${attendee.token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.booking.status).toBe('cancelled');

      eventCheck = await request(app).get(`/api/events/${eventId}`);
      expect(eventCheck.body.data.event.seatsRemaining).toBe(5);
    });

    it('forbids cancelling someone else\'s booking (403)', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const intruder = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 5 });

      const booking = await request(app)
        .post(`/api/events/${event.body.data.event.id}/bookings`)
        .set('Authorization', `Bearer ${attendee.token}`)
        .send({ seats: 1 });

      const res = await request(app)
        .delete(`/api/bookings/${booking.body.data.booking.id}`)
        .set('Authorization', `Bearer ${intruder.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/events/:id/bookings (organizer-only view)', () => {
    it('allows the organizer to view all bookings for their event', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token, { capacity: 5 });
      const eventId = event.body.data.event.id;

      await request(app)
        .post(`/api/events/${eventId}/bookings`)
        .set('Authorization', `Bearer ${attendee.token}`)
        .send({ seats: 2 });

      const res = await request(app)
        .get(`/api/events/${eventId}/bookings`)
        .set('Authorization', `Bearer ${organizer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings).toHaveLength(1);
      expect(res.body.data.bookings[0].attendee).toHaveProperty('email');
    });

    it('forbids an attendee from viewing the event booking list (403)', async () => {
      const organizer = await createUser({ role: 'organizer' });
      const attendee = await createUser({ role: 'attendee' });
      const event = await createEvent(organizer.token);

      const res = await request(app)
        .get(`/api/events/${event.body.data.event.id}/bookings`)
        .set('Authorization', `Bearer ${attendee.token}`);

      expect(res.status).toBe(403);
    });
  });
});
