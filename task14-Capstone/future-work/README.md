# Future Work (built, tested, set aside for this submission)

Everything in this folder is **complete, working code** that was removed
from the active `src/` tree only to keep local setup down to a single
dependency (Postgres) ahead of a submission deadline. Nothing here is a
stub or a sketch - all of it passed a full integration test suite,
including a test that ran a real BullMQ worker against a real Redis
instance, and webhook tests that verify genuine HMAC-SHA256 signatures
(not mocked).

## What's here

| File | What it does |
|---|---|
| `controllers/checkout.controller.js` | Paid checkout flow: reserves seats, opens a Stripe PaymentIntent, only confirms via webhook |
| `controllers/webhook.controller.js` | Stripe webhook handler - verifies signature, confirms/expires bookings |
| `controllers/waitlist.controller.js` | Join/leave a waitlist for sold-out events |
| `services/stripe.service.js` | PaymentIntent creation + webhook signature verification/generation |
| `services/email.service.js` | Transport-agnostic email sending (console log in dev, SMTP in prod) |
| `services/waitlist.service.js` | Strict-FIFO waitlist promotion logic, reused by cancellation and payment expiry |
| `jobs/queues.js`, `jobs/worker.js` | BullMQ queue definitions + processors for emails and payment-hold expiry |
| `worker-process.js` | Standalone entry point to run the background worker as its own process |
| `routes/webhook.routes.js`, `routes/waitlist.routes.js` | Express routers for the above |
| `validators/waitlist.validators.js` | Zod schemas for waitlist endpoints |
| `config/redis.js` | Shared ioredis connection used by BullMQ |

The corresponding tests (`checkout.test.js`, `webhook.test.js`,
`waitlist.test.js`, `jobs.test.js`) live in `tests/` here and are excluded
from the active Jest run via `testPathIgnorePatterns` in `jest.config.js`.

## How to wire it back in

1. Move each file back to its original path under `src/`/`tests/integration/`
   (mirror the folder structure shown above, minus the `future-work/` prefix).
2. `npm install bullmq ioredis nodemailer stripe`
3. In `src/app.js`: re-add the `webhookRoutes`/`waitlistRoutes` imports and
   mounting (the webhook route must be mounted with `express.raw()` *before*
   `express.json()` - see the comments still present in
   `future-work/routes/webhook.routes.js`).
4. In `src/routes/event.routes.js`: re-add the `checkoutController` and
   `waitlistController` imports and the `/checkout` and `/waitlist` routes.
5. In `src/controllers/booking.controller.js`: re-add the `emailQueue`/
   `promoteWaitlist` imports and calls in `create`/`cancel` (see git history
   on this file, or the versions of this logic described in
   `docs/ARCHITECTURE.md`'s "future-work" note for what changed).
6. Restore `REDIS_URL`/`SMTP_*`/`STRIPE_*`/`PAYMENT_HOLD_MINUTES` to
   `.env.example`, `docker-compose.yml` (add back the `redis` and `worker`
   services), and `.github/workflows/ci.yml` (add back the `redis` service
   container).
7. Remove `testPathIgnorePatterns` from `jest.config.js`, or narrow it.
8. `npm test` - should be back to 52 passing tests.

## Why these design choices, if you want to talk about them

See [`ARCHITECTURE_NOTES.md`](ARCHITECTURE_NOTES.md) in this folder for the
full reasoning: reservation-before-payment-confirmation to avoid oversold
seats, strict-FIFO waitlist promotion to avoid starving larger parties, and
a separate worker process so a slow SMTP call or a 15-minute delayed job
never lives inside an HTTP request/response cycle.
