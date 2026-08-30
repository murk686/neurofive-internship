const { Worker } = require('bullmq');
const connection = require('../config/redis');
const { sequelize, Booking, Event } = require('../models');
const { sendEmail, templates } = require('../services/email.service');
const { promoteWaitlist } = require('../services/waitlist.service');

/**
 * Email worker: loads the booking + event + attendee for context, then
 * sends the appropriate templated email. Runs out-of-band from the HTTP
 * request/response cycle so slow email delivery never blocks an API call.
 */
function startEmailWorker() {
  return new Worker(
    'email',
    async (job) => {
      const booking = await Booking.findByPk(job.data.bookingId, {
        include: [
          { model: Event, as: 'event' },
          { association: 'attendee' },
        ],
      });
      if (!booking) return; // booking may have been hard-deleted since; nothing to do

      const template = templates[job.name];
      if (!template) throw new Error(`No email template registered for job "${job.name}"`);

      const { subject, text } = template(booking, booking.event);
      await sendEmail({ to: booking.attendee.email, subject, text });
    },
    { connection }
  );
}

/**
 * Payment-expiry worker: fires HOLD_MINUTES after a checkout was started.
 * If the booking is still 'pending_payment' (i.e. the webhook never marked
 * it confirmed), the seat hold is released and any waitlisted attendees who
 * now fit are promoted - all inside one locked transaction, same pattern as
 * booking cancellation.
 */
function startPaymentExpiryWorker() {
  return new Worker(
    'payment-expiry',
    async (job) => {
      const { bookingId } = job.data;

      await sequelize.transaction(async (t) => {
        const booking = await Booking.findByPk(bookingId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!booking || booking.status !== 'pending_payment') return; // already resolved

        booking.status = 'expired';
        await booking.save({ transaction: t });

        const event = await Event.findByPk(booking.eventId, { transaction: t, lock: t.LOCK.UPDATE });
        if (event) {
          event.seatsRemaining += booking.seats;
          await event.save({ transaction: t });
          await promoteWaitlist(event, t);
        }
      });
    },
    { connection }
  );
}

function startWorkers() {
  const emailWorker = startEmailWorker();
  const paymentExpiryWorker = startPaymentExpiryWorker();

  emailWorker.on('failed', (job, err) => {
    console.error(`[worker:email] job ${job?.id} failed:`, err.message);
  });
  paymentExpiryWorker.on('failed', (job, err) => {
    console.error(`[worker:payment-expiry] job ${job?.id} failed:`, err.message);
  });

  return { emailWorker, paymentExpiryWorker };
}

module.exports = { startWorkers };
