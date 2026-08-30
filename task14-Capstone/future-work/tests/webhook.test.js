const request = require('supertest');
const { app, createUser, createEvent } = require('../helpers');
const { Booking, Event } = require('../../src/models');
const { generateTestSignatureHeader } = require('../../src/services/stripe.service');

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function stripeEventPayload(type, paymentIntentId) {
  return JSON.stringify({
    id: `evt_test_${Date.now()}`,
    type,
    data: { object: { id: paymentIntentId, object: 'payment_intent' } },
  });
}

async function startCheckout(attendeeToken, eventId, seats = 1) {
  const res = await request(app)
    .post(`/api/events/${eventId}/checkout`)
    .set('Authorization', `Bearer ${attendeeToken}`)
    .send({ seats });
  return res.body.data.booking;
}

describe('Stripe webhook', () => {
  it('rejects a request with an invalid signature (real HMAC verification)', async () => {
    const payload = stripeEventPayload('payment_intent.succeeded', 'pi_fake');
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=123,v1=deadbeef')
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('rejects a request signed with the wrong secret', async () => {
    const payload = stripeEventPayload('payment_intent.succeeded', 'pi_fake');
    const badSignature = generateTestSignatureHeader(payload, 'wrong_secret_entirely');

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', badSignature)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('confirms a pending booking on payment_intent.succeeded with a validly-signed payload', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 5, price: 30 });
    const booking = await startCheckout(attendee.token, event.body.data.event.id, 2);

    const payload = stripeEventPayload('payment_intent.succeeded', booking.stripePaymentIntentId);
    const signature = generateTestSignatureHeader(payload, WEBHOOK_SECRET);

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);

    const updated = await Booking.findByPk(booking.id);
    expect(updated.status).toBe('confirmed');
  });

  it('releases the seat hold on payment_intent.payment_failed', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 5, price: 30 });
    const eventId = event.body.data.event.id;
    const booking = await startCheckout(attendee.token, eventId, 3);

    let eventCheck = await Event.findByPk(eventId);
    expect(eventCheck.seatsRemaining).toBe(2);

    const payload = stripeEventPayload('payment_intent.payment_failed', booking.stripePaymentIntentId);
    const signature = generateTestSignatureHeader(payload, WEBHOOK_SECRET);

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);

    const updatedBooking = await Booking.findByPk(booking.id);
    expect(updatedBooking.status).toBe('expired');

    eventCheck = await Event.findByPk(eventId);
    expect(eventCheck.seatsRemaining).toBe(5);
  });

  it('acknowledges but ignores unrecognized event types', async () => {
    const payload = stripeEventPayload('customer.created', 'irrelevant');
    const signature = generateTestSignatureHeader(payload, WEBHOOK_SECRET);

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
  });
});
