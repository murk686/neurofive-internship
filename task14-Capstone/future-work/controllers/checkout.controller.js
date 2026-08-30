const { sequelize, Event, Booking } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { createPaymentIntent } = require('../services/stripe.service');
const { paymentExpiryQueue } = require('../jobs/queues');

const HOLD_MINUTES = Number(process.env.PAYMENT_HOLD_MINUTES) || 15;

/**
 * Paid checkout flow: reserves seats immediately (same locking strategy as
 * the free booking flow) with status 'pending_payment', creates a Stripe
 * PaymentIntent, and schedules a delayed job that releases the hold if
 * payment isn't confirmed within HOLD_MINUTES. The booking is only flipped
 * to 'confirmed' by the Stripe webhook once payment actually succeeds -
 * never directly by this endpoint - so a client can't self-confirm without
 * paying.
 */
const create = catchAsync(async (req, res) => {
  const { seats } = req.body;
  const eventId = req.params.id;

  const { booking, event } = await sequelize.transaction(async (t) => {
    const ev = await Event.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });

    if (!ev) throw ApiError.notFound('Event not found');
    if (ev.status !== 'published') {
      throw ApiError.badRequest('This event is not open for booking');
    }
    if (new Date(ev.startTime) <= new Date()) {
      throw ApiError.badRequest('This event has already started');
    }
    if (Number(ev.price) <= 0) {
      throw ApiError.badRequest('This event is free - use POST /events/:id/bookings instead');
    }
    if (ev.seatsRemaining < seats) {
      throw ApiError.conflict(`Only ${ev.seatsRemaining} seat(s) remaining for this event`);
    }

    ev.seatsRemaining -= seats;
    await ev.save({ transaction: t });

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
    const newBooking = await Booking.create(
      {
        eventId,
        userId: req.user.id,
        seats,
        totalPrice: Number(ev.price) * seats,
        status: 'pending_payment',
        paymentHoldExpiresAt: holdExpiresAt,
      },
      { transaction: t }
    );

    return { booking: newBooking, event: ev };
  });

  let paymentIntent;
  try {
    paymentIntent = await createPaymentIntent({
      amount: Number(booking.totalPrice),
      metadata: { bookingId: booking.id, eventId: event.id, userId: req.user.id },
    });
  } catch {
    // Stripe call failed - release the seat hold we just took instead of
    // leaving an orphaned pending_payment booking with no way to pay.
    await sequelize.transaction(async (t) => {
      const ev = await Event.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });
      if (ev) {
        ev.seatsRemaining += booking.seats;
        await ev.save({ transaction: t });
      }
      booking.status = 'expired';
      await booking.save({ transaction: t });
    });
    throw ApiError.internal('Unable to start payment - please try again');
  }

  booking.stripePaymentIntentId = paymentIntent.id;
  await booking.save();

  await paymentExpiryQueue.add(
    'expireBooking',
    { bookingId: booking.id },
    { delay: HOLD_MINUTES * 60 * 1000 }
  );

  res.status(201).json({
    success: true,
    data: {
      booking,
      clientSecret: paymentIntent.client_secret,
      holdExpiresAt: booking.paymentHoldExpiresAt,
    },
  });
});

module.exports = { create };
