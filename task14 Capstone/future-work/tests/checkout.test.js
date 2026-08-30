const request = require('supertest');
const { app, createUser, createEvent } = require('../helpers');
const { Booking, Event } = require('../../src/models');

describe('Checkout (Stripe payment flow)', () => {
  it('creates a pending_payment booking, reserves seats, and returns a client secret', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 5, price: 50 });
    const eventId = event.body.data.event.id;

    const res = await request(app)
      .post(`/api/events/${eventId}/checkout`)
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ seats: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('pending_payment');
    expect(Number(res.body.data.booking.totalPrice)).toBe(100);
    expect(typeof res.body.data.clientSecret).toBe('string');
    expect(res.body.data.booking.stripePaymentIntentId).toMatch(/^pi_test_/);

    // Seats should already be reserved even though payment hasn't completed.
    const eventCheck = await Event.findByPk(eventId);
    expect(eventCheck.seatsRemaining).toBe(3);
  });

  it('rejects checkout for a free event (price 0)', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 5, price: 0 });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/checkout`)
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ seats: 1 });

    expect(res.status).toBe(400);
  });

  it('rejects checkout requesting more seats than remain', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 1, price: 20 });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/checkout`)
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ seats: 2 });

    expect(res.status).toBe(409);
  });

  it('requires authentication', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const event = await createEvent(organizer.token, { price: 20 });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/checkout`)
      .send({ seats: 1 });

    expect(res.status).toBe(401);
  });

  it('does not confirm the booking on its own - only the webhook can do that', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 5, price: 20 });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/checkout`)
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ seats: 1 });

    const booking = await Booking.findByPk(res.body.data.booking.id);
    expect(booking.status).toBe('pending_payment');
  });
});
