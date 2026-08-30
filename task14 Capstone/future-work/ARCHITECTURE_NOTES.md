# Architecture notes: Payments, Waitlist, and Background Jobs

These are the design-decision writeups for the features in this folder,
originally part of `docs/ARCHITECTURE.md` before being moved here to keep
the main doc focused on what's actually running in this submission.

## Waitlist: reusing the concurrency pattern

The waitlist feature (`services/waitlist.service.js`) was built to slot
into the *exact same* transaction-plus-row-lock pattern as booking
cancellation, rather than becoming a separate subsystem. `promoteWaitlist(event, transaction)`
takes an already-locked `Event` row and mutates it in place; callers
(booking cancellation, payment-hold expiry) are responsible for locking the
row first and saving it after. This means waitlist promotion is atomic with
the seat-freeing event that triggered it - there's no window where seats
could be freed but a concurrent booking request grabs them before the
waitlist gets a chance.

**Fairness trade-off - strict FIFO, no skip-ahead:** if the party at the
front of the waitlist wants 4 seats and only 2 just freed up, promotion
stops there, even if a 2-seat party is next in line and would fit. The
alternative (skip ahead to whoever fits) improves seat utilization but lets
small parties perpetually leapfrog a larger one, which can starve it
indefinitely as an event's turnover continues. I chose fairness: whoever
joined the waitlist first is guaranteed to be served first, once enough
capacity exists - see `tests/waitlist.test.js` for a test that explicitly
proves this ordering guarantee.

## Payments: reservation happens before confirmation

A common naive design for "pay to book" is: charge the card, *then* create
the booking. That has an obvious flaw for a limited-capacity resource - two
people can both start paying for the last seat, both payments can succeed,
and now the event is oversold with no clean way to un-charge one of them
after the fact.

Instead, `POST /events/:id/checkout` reserves the seat *first* (same
row-locked transaction as the free booking flow) with status
`pending_payment`, then opens the Stripe PaymentIntent. The seat is
unavailable to anyone else the instant the hold is taken, not once payment
clears. This pushes the failure mode from "double-sold seats" (bad, hard to
undo) to "briefly held seats that release automatically if payment doesn't
complete" (fine, self-healing) - handled by:

- A **delayed BullMQ job**, scheduled at checkout time for
  `PAYMENT_HOLD_MINUTES` later, which expires the hold if the webhook never
  arrived.
- The **`payment_intent.payment_failed` webhook event**, for the common case
  where Stripe tells us quickly that the card was declined - no need to
  wait out the full hold window.

Either path releases the seats and re-runs waitlist promotion, since
freeing a held seat is functionally identical to a cancellation for anyone
waiting.

**Why the booking is only confirmed by the webhook, never by the checkout
endpoint's response:** if `POST /checkout` itself marked the booking
`confirmed`, a client could call that endpoint and immediately have a
"confirmed" booking without ever completing payment. Confirmation only
happens in `webhook.controller.js`, driven by a Stripe event whose
signature was verified server-side - the client has no path to self-confirm.

**Testing without live Stripe access:** `paymentIntents.create` requires a
real network call to Stripe, which isn't something a CI runner should
depend on to pass. `__mocks__/stripe.js` (restore this to the project root
if re-enabling) is a Jest manual mock that fakes that one network-bound
call, but *keeps the webhook signature verification real* - it
reimplements Stripe's documented HMAC-SHA256 scheme with Node's built-in
`crypto`, so `tests/webhook.test.js` genuinely exercises valid-signature,
invalid-signature, and wrong-secret cases rather than assuming verification
works. This mirrors Stripe's own recommended testing approach: mock the SDK
for unit/integration tests, use the Stripe CLI (`stripe trigger`, `stripe
listen`) for true end-to-end verification against a running server.

## Background jobs: what runs async, and why

Two things are queued rather than done inline in the request handler:

- **Emails** (`bookingConfirmed`, `bookingCancelled`, `waitlistPromoted`) -
  an SMTP call is slow and occasionally fails; neither should be able to
  slow down or fail a booking API response. The queue also means adding a
  new notification type later doesn't touch the booking transaction at all.
- **Payment-hold expiry** - inherently a delayed, time-based operation, which
  is exactly what a job queue is for. Modeling it as `setTimeout` in the
  Node process would lose all pending timers on every deploy/restart;
  modeling it as a BullMQ delayed job means it survives restarts (state
  lives in Redis) and can run from any worker instance.

The worker is a **separate process** (`worker-process.js`, a separate
service in `docker-compose.yml` if re-enabled) from the web server, not
started inline inside `server.js`. This mirrors how you'd actually deploy
this - a web dyno/instance handling HTTP traffic and a worker dyno/instance
processing jobs, scaled independently.
