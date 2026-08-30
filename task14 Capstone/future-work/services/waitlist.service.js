const { Booking, WaitlistEntry } = require('../models');

/**
 * Given an Event row that has just gained free seats (from a cancellation
 * or an expired payment hold), promotes waiting entries FIFO until either
 * the waitlist is empty or the next entry in line doesn't fit.
 *
 * Design choice - strict FIFO, no skip-ahead: if the party at the front of
 * the queue wants more seats than just freed up, promotion stops there even
 * if a smaller party further back would fit. The alternative (skip ahead to
 * whoever fits next) optimizes seat utilization but lets small parties
 * perpetually leapfrog a larger one, starving them indefinitely. Strict
 * FIFO trades a little utilization for fairness - whoever joined the
 * waitlist first is guaranteed to be served first once enough seats exist.
 *
 * Must be called with the Event row already locked (FOR UPDATE) inside the
 * caller's transaction, since this mutates event.seatsRemaining directly -
 * callers are responsible for saving the event afterward.
 *
 * Returns the list of newly-created (confirmed) bookings, so the caller can
 * enqueue "you got a seat!" emails once the transaction commits.
 */
async function promoteWaitlist(event, transaction) {
  const promotedBookings = [];

  while (true) {
    if (event.seatsRemaining <= 0) break;

    const next = await WaitlistEntry.findOne({
      where: { eventId: event.id, status: 'waiting' },
      order: [['createdAt', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!next || next.seats > event.seatsRemaining) break;

    event.seatsRemaining -= next.seats;
    await event.save({ transaction });

    const booking = await Booking.create(
      {
        eventId: event.id,
        userId: next.userId,
        seats: next.seats,
        totalPrice: Number(event.price) * next.seats,
        status: 'confirmed',
      },
      { transaction }
    );

    next.status = 'promoted';
    next.promotedBookingId = booking.id;
    await next.save({ transaction });

    promotedBookings.push(booking);
  }

  return promotedBookings;
}

module.exports = { promoteWaitlist };
