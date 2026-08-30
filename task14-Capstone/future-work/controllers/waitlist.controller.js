const { Event, WaitlistEntry } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildMeta } = require('../utils/paginate');

const join = catchAsync(async (req, res) => {
  const { seats } = req.body;
  const eventId = req.params.id;

  const event = await Event.findByPk(eventId);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.status !== 'published') {
    throw ApiError.badRequest('This event is not open for booking');
  }
  if (event.seatsRemaining >= seats) {
    throw ApiError.badRequest(
      'Seats are currently available - book directly instead of joining the waitlist'
    );
  }

  const entry = await WaitlistEntry.create({
    eventId,
    userId: req.user.id,
    seats,
    status: 'waiting',
  });

  res.status(201).json({ success: true, data: { waitlistEntry: entry } });
});

const listMine = catchAsync(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);

  const { rows, count } = await WaitlistEntry.findAndCountAll({
    where: { userId: req.user.id },
    include: [{ model: Event, as: 'event', attributes: ['id', 'title', 'startTime', 'location'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: { waitlistEntries: rows },
    meta: buildMeta({ page, limit, total: count }),
  });
});

const leave = catchAsync(async (req, res) => {
  const entry = await WaitlistEntry.findByPk(req.params.id);
  if (!entry) throw ApiError.notFound('Waitlist entry not found');
  if (entry.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to modify this waitlist entry');
  }
  if (entry.status !== 'waiting') {
    throw ApiError.badRequest('This waitlist entry is no longer active');
  }

  entry.status = 'cancelled';
  await entry.save();

  res.status(200).json({ success: true, data: { waitlistEntry: entry } });
});

module.exports = { join, listMine, leave };
