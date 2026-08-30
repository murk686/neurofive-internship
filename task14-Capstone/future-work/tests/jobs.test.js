const { QueueEvents } = require('bullmq');
const { createUser, createEvent } = require('../helpers');
const connection = require('../../src/config/redis');
const { emailQueue } = require('../../src/jobs/queues');
const { startWorkers } = require('../../src/jobs/worker');
const { sentEmails } = require('../../src/services/email.service');
const request = require('supertest');
const { app } = require('../helpers');

describe('Background job queue (real Redis + real worker)', () => {
  let workers;
  let queueEvents;

  beforeAll(async () => {
    workers = startWorkers();
    queueEvents = new QueueEvents('email', { connection: connection.duplicate() });
    await queueEvents.waitUntilReady();
  });

  afterAll(async () => {
    await queueEvents.close();
    await workers.emailWorker.close();
    await workers.paymentExpiryWorker.close();
  });

  it('actually processes a bookingConfirmed job end-to-end and "sends" the email', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const attendee = await createUser({ role: 'attendee' });
    const event = await createEvent(organizer.token, { title: 'Worker Test Event', capacity: 5 });

    const bookingRes = await request(app)
      .post(`/api/events/${event.body.data.event.id}/bookings`)
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ seats: 1 });

    const emailsBefore = sentEmails.length;

    // The booking controller already enqueued a "bookingConfirmed" job -
    // wait for the real worker to actually pick it up and finish it.
    const jobs = await emailQueue.getJobs(['waiting', 'active', 'completed']);
    const job = jobs.find((j) => j.data.bookingId === bookingRes.body.data.booking.id);
    expect(job).toBeDefined();

    await job.waitUntilFinished(queueEvents, 10000);

    expect(sentEmails.length).toBeGreaterThan(emailsBefore);
    const sent = sentEmails[sentEmails.length - 1];
    expect(sent.to).toBe(attendee.user.email);
    expect(sent.subject).toMatch(/Worker Test Event/);
  }, 15000);
});
