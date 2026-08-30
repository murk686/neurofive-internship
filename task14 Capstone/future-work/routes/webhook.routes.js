const express = require('express');
const { handleStripeWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

// Note: express.raw() captures the body as an untouched Buffer, which is
// required for Stripe's HMAC signature verification. This route is mounted
// in app.js BEFORE the global express.json() middleware so nothing else
// consumes/parses the body stream first.
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
