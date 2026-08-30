const { sequelize, Event, Booking, User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildMeta } = require('../utils/paginate');

const eventSummary = {
  model: Event,
  as: 'event',
  attributes: ['id', 'title', 'startTime', 'endTime', 'location', 'price'],
};

/**
 * Creates a booking and decrements the event's seat count atomically.
 * Uses a row-level lock (SELECT ... FOR UPDATE) inside a transaction so
 * concurrent booking requests for the same event can never oversell seats.
 */
const create = catchAsync(async (req, res) => {
  const { seats } = req.body;
  const eventId = req.params.id;

  const booking = await sequelize.transaction(async (t) => {
    const event = await Event.findByPk(eventId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!event) throw ApiError.notFound('Event not found');
    if (event.status !== 'published') {
      throw ApiError.badRequest('This event is not open for booking');
    }
    if (new Date(event.startTime) <= new Date()) {
      throw ApiError.badRequest('This event has already started');
    }
    if (event.seatsRemaining < seats) {
      throw ApiError.conflict(
        `Only ${event.seatsRemaining} seat(s) remaining for this event`
      );
    }

    event.seatsRemaining -= seats;
    await event.save({ transaction: t });

    return Booking.create(
      {
        eventId,
        userId: req.user.id,
        seats,
        totalPrice: Number(event.price) * seats,
        status: 'confirmed',
      },
      { transaction: t }
    );
  });

  res.status(201).json({ success: true, data: { booking } });
});

const listMine = catchAsync(async (req, res) => {
  const { status } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const where = { userId: req.user.id };
  if (status) where.status = status;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: [eventSummary],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: { bookings: rows },
    meta: buildMeta({ page, limit, total: count }),
  });
});

/**
 * Organizer-only: list every booking made against one of their events.
 */
const listForEvent = catchAsync(async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to view these bookings');
  }

  const { page, limit, offset } = getPagination(req.query);
  const { rows, count } = await Booking.findAndCountAll({
    where: { eventId: event.id },
    include: [{ model: User, as: 'attendee', attributes: ['id', 'name', 'email'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: { bookings: rows },
    meta: buildMeta({ page, limit, total: count }),
  });
});

/**
 * Cancels a booking owned by the requesting user and restores the seats
 * to the event, atomically.
 */
const cancel = catchAsync(async (req, res) => {
  const booking = await sequelize.transaction(async (t) => {
    const b = await Booking.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!b) throw ApiError.notFound('Booking not found');
    if (b.userId !== req.user.id) {
      throw ApiError.forbidden('You do not have permission to cancel this booking');
    }
    if (b.status === 'cancelled') {
      throw ApiError.badRequest('Booking is already cancelled');
    }

    b.status = 'cancelled';
    await b.save({ transaction: t });

    const event = await Event.findByPk(b.eventId, { transaction: t, lock: t.LOCK.UPDATE });
    if (event) {
      event.seatsRemaining += b.seats;
      await event.save({ transaction: t });
    }

    return b;
  });

  res.status(200).json({ success: true, data: { booking } });
});

module.exports = { create, listMine, listForEvent, cancel };
