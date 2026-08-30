const { Op } = require('sequelize');
const { Event, User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildMeta } = require('../utils/paginate');

const organizerSummary = { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] };

const create = catchAsync(async (req, res) => {
  const { title, description, category, location, startTime, endTime, capacity, price, status } =
    req.body;

  const event = await Event.create({
    organizerId: req.user.id,
    title,
    description,
    category,
    location,
    startTime,
    endTime,
    capacity,
    seatsRemaining: capacity,
    price,
    status,
  });

  res.status(201).json({ success: true, data: { event } });
});

const list = catchAsync(async (req, res) => {
  const { category, location, search, startDate, endDate, sortBy, order } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const where = { status: 'published' };
  if (category) where.category = { [Op.iLike]: category };
  if (location) where.location = { [Op.iLike]: `%${location}%` };
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime[Op.gte] = new Date(startDate);
    if (endDate) where.startTime[Op.lte] = new Date(endDate);
  }

  const { rows, count } = await Event.findAndCountAll({
    where,
    include: [organizerSummary],
    limit,
    offset,
    order: [[sortBy || 'startTime', (order || 'asc').toUpperCase()]],
  });

  res.status(200).json({
    success: true,
    data: { events: rows },
    meta: buildMeta({ page, limit, total: count }),
  });
});

const getById = catchAsync(async (req, res) => {
  const event = await Event.findByPk(req.params.id, { include: [organizerSummary] });
  if (!event) throw ApiError.notFound('Event not found');
  res.status(200).json({ success: true, data: { event } });
});

const loadOwnedEvent = async (req) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.organizerId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to modify this event');
  }
  return event;
};

const update = catchAsync(async (req, res) => {
  const event = await loadOwnedEvent(req);

  // Guard against shrinking capacity below seats already booked.
  if (req.body.capacity !== undefined) {
    const seatsBooked = event.capacity - event.seatsRemaining;
    if (req.body.capacity < seatsBooked) {
      throw ApiError.badRequest(
        `Capacity cannot be less than ${seatsBooked} seats already booked`
      );
    }
    event.seatsRemaining = req.body.capacity - seatsBooked;
  }

  Object.assign(event, req.body);
  await event.save();

  res.status(200).json({ success: true, data: { event } });
});

const remove = catchAsync(async (req, res) => {
  const event = await loadOwnedEvent(req);
  await event.destroy();
  res.status(204).send();
});

const uploadCoverImage = catchAsync(async (req, res) => {
  const event = await loadOwnedEvent(req);

  if (!req.file) {
    throw ApiError.badRequest('No image file provided (expected multipart field "image")');
  }

  event.coverImageUrl = `/uploads/events/${req.file.filename}`;
  await event.save();

  res.status(200).json({ success: true, data: { event } });
});

module.exports = { create, list, getById, update, remove, uploadCoverImage };
