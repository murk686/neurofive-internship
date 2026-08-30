const { Queue } = require('bullmq');
const connection = require('../config/redis');

// Fires immediately (fast, best-effort) - booking/waitlist emails.
const emailQueue = new Queue('email', { connection });

// Fires after a delay - releases a payment hold if checkout isn't completed
// in time. See jobs/worker.js for the processor and services/stripe.service.js
// for why the seats are reserved *before* payment succeeds.
const paymentExpiryQueue = new Queue('payment-expiry', { connection });

module.exports = { emailQueue, paymentExpiryQueue };
