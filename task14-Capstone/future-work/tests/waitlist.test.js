const request = require('supertest');
const { app, createUser, createEvent } = require('../helpers');
const { Booking } = require('../../src/models');

async function fillEvent(attendeeToken, eventId, seats) {
  return request(app)
    .post(`/api/events/${eventId}/bookings`)
    .set('Authorization', `Bearer ${attendeeToken}`)
    .send({ seats });
}

describe('Waitlist', () => {
  it('rejects joining the waitlist when seats are actually available', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 10 });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/waitlist`)
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ seats: 2 });

    expect(res.status).toBe(400);
  });

  it('allows joining the waitlist once an event is sold out', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const firstAttendee = await createUser({ role: 'attendee' });
    const waitlister = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 2 });
    const eventId = event.body.data.event.id;

    await fillEvent(firstAttendee.token, eventId, 2);

    const res = await request(app)
      .post(`/api/events/${eventId}/waitlist`)
      .set('Authorization', `Bearer ${waitlister.token}`)
      .send({ seats: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.waitlistEntry.status).toBe('waiting');
  });

  it('auto-promotes the next waitlisted attendee when a booking is cancelled', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const firstAttendee = await createUser({ role: 'attendee' });
    const waitlister = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 1 });
    const eventId = event.body.data.event.id;

    const firstBooking = await fillEvent(firstAttendee.token, eventId, 1);

    await request(app)
      .post(`/api/events/${eventId}/waitlist`)
      .set('Authorization', `Bearer ${waitlister.token}`)
      .send({ seats: 1 });

    // Cancelling the only booking should free the seat and immediately
    // promote the waitlisted attendee into a real, confirmed booking.
    const cancelRes = await request(app)
      .delete(`/api/bookings/${firstBooking.body.data.booking.id}`)
      .set('Authorization', `Bearer ${firstAttendee.token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.waitlistPromotions).toBe(1);

    const promotedBooking = await Booking.findOne({ where: { userId: waitlister.user.id, eventId } });
    expect(promotedBooking).not.toBeNull();
    expect(promotedBooking.status).toBe('confirmed');

    // Waitlist entry should now reflect it was promoted.
    const myWaitlist = await request(app)
      .get('/api/waitlist/me')
      .set('Authorization', `Bearer ${waitlister.token}`);
    expect(myWaitlist.body.data.waitlistEntries[0].status).toBe('promoted');
  });

  it('does not skip ahead in line: a party that does not fit blocks smaller parties behind it (strict FIFO)', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const firstAttendee = await createUser({ role: 'attendee' });
    const secondAttendee = await createUser({ role: 'attendee' });
    const bigWaitlister = await createUser({ role: 'attendee' });
    const smallWaitlister = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 2 });
    const eventId = event.body.data.event.id;

    const firstBooking = await fillEvent(firstAttendee.token, eventId, 1);
    await fillEvent(secondAttendee.token, eventId, 1);

    // Front of the line wants 2 seats; behind them, someone who'd only need 1.
    await request(app)
      .post(`/api/events/${eventId}/waitlist`)
      .set('Authorization', `Bearer ${bigWaitlister.token}`)
      .send({ seats: 2 });
    await request(app)
      .post(`/api/events/${eventId}/waitlist`)
      .set('Authorization', `Bearer ${smallWaitlister.token}`)
      .send({ seats: 1 });

    // Only 1 seat frees up - not enough for the party at the front of the
    // line. By design, this does NOT skip ahead to the smaller party behind
    // them (that would let small parties perpetually leapfrog a larger one
    // and starve it) - it simply waits.
    const cancelRes = await request(app)
      .delete(`/api/bookings/${firstBooking.body.data.booking.id}`)
      .set('Authorization', `Bearer ${firstAttendee.token}`);

    expect(cancelRes.body.data.waitlistPromotions).toBe(0);
    expect(await Booking.findOne({ where: { userId: smallWaitlister.user.id, eventId } })).toBeNull();
    expect(await Booking.findOne({ where: { userId: bigWaitlister.user.id, eventId } })).toBeNull();

    // Now enough seats free up for the front-of-line party - they get
    // promoted first, exactly as FIFO promises.
    const secondBooking = await Booking.findOne({ where: { userId: secondAttendee.user.id, eventId } });
    const secondCancel = await request(app)
      .delete(`/api/bookings/${secondBooking.id}`)
      .set('Authorization', `Bearer ${secondAttendee.token}`);

    expect(secondCancel.body.data.waitlistPromotions).toBe(1);
    const bigBooking = await Booking.findOne({ where: { userId: bigWaitlister.user.id, eventId } });
    expect(bigBooking).not.toBeNull();
    expect(bigBooking.status).toBe('confirmed');
  });

  it('allows leaving the waitlist', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const firstAttendee = await createUser({ role: 'attendee' });
    const waitlister = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { capacity: 1 });
    const eventId = event.body.data.event.id;

    await fillEvent(firstAttendee.token, eventId, 1);
    const joinRes = await request(app)
      .post(`/api/events/${eventId}/waitlist`)
      .set('Authorization', `Bearer ${waitlister.token}`)
      .send({ seats: 1 });

    const leaveRes = await request(app)
      .delete(`/api/waitlist/${joinRes.body.data.waitlistEntry.id}`)
      .set('Authorization', `Bearer ${waitlister.token}`);

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.data.waitlistEntry.status).toBe('cancelled');
  });
});
