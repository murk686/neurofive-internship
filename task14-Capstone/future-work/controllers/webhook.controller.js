const { sequelize, Booking, Event } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyWebhookSignature } = require('../services/stripe.service');
const { emailQueue } = require('../jobs/queues');
const { promoteWaitlist } = require('../services/waitlist.service');

/**
 * Handles Stripe webhook events. Mounted with express.raw() (see app.js) so
 * req.body is the untouched raw buffer required for signature verification -
 * it must NOT pass through express.json() first.
 */
const handleStripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = verifyWebhookSignature(req.body, signature, secret);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const booking = await Booking.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      });
      if (booking && booking.status === 'pending_payment') {
        booking.status = 'confirmed';
        await booking.save();
        await emailQueue.add('bookingConfirmed', { bookingId: booking.id });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      await sequelize.transaction(async (t) => {
        const booking = await Booking.findOne({
          where: { stripePaymentIntentId: paymentIntent.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!booking || booking.status !== 'pending_payment') return;

        booking.status = 'expired';
        await booking.save({ transaction: t });

        const ev = await Event.findByPk(booking.eventId, { transaction: t, lock: t.LOCK.UPDATE });
        if (ev) {
          ev.seatsRemaining += booking.seats;
          await ev.save({ transaction: t });
          await promoteWaitlist(ev, t);
        }
      });
      break;
    }

    default:
      // Unhandled event types are ignored but acknowledged (200), per
      // Stripe's recommendation, so it doesn't keep retrying delivery.
      break;
  }

  res.status(200).json({ received: true });
});

module.exports = { handleStripeWebhook };
