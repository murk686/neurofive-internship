const express = require('express');
const eventController = require('../controllers/event.controller');
const bookingController = require('../controllers/booking.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const eventSchemas = require('../validators/event.validators');
const bookingSchemas = require('../validators/booking.validators');

const router = express.Router();

// Public
router.get('/', validate(eventSchemas.list), eventController.list);
router.get('/:id', validate(eventSchemas.idParam), eventController.getById);

// Organizer-only (role-based access control)
router.post(
  '/',
  authenticate,
  authorize('organizer'),
  validate(eventSchemas.create),
  eventController.create
);
router.put(
  '/:id',
  authenticate,
  authorize('organizer'),
  validate(eventSchemas.update),
  eventController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize('organizer'),
  validate(eventSchemas.idParam),
  eventController.remove
);
router.post(
  '/:id/cover-image',
  authenticate,
  authorize('organizer'),
  validate(eventSchemas.idParam),
  upload.single('image'),
  eventController.uploadCoverImage
);

// Nested booking routes (free/direct booking - confirms immediately)
router.post(
  '/:id/bookings',
  authenticate,
  validate(bookingSchemas.create),
  bookingController.create
);
router.get(
  '/:id/bookings',
  authenticate,
  authorize('organizer'),
  validate(bookingSchemas.list),
  bookingController.listForEvent
);

module.exports = router;
