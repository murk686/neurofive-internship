# Architecture & Design Decisions

## 1. Domain model

Three resources, two relationships that matter:

```
User (organizer) --< Event >-- Booking >-- User (attendee)
```

- A `User` has a single `role` (`attendee` | `organizer`) rather than a
  many-to-many roles table. Real event platforms often let one person be
  both an attendee *and* an organizer. I chose a single role field anyway
  because the task scope calls for "role-based access on at least 2
  endpoints," not a full permissions system, and a single enum keeps the
  auth middleware trivial to read and test. **Trade-off:** an organizer
  account can't also book events as themselves without a second account.
  A production version would likely split this into a `roles` join table
  or a `capabilities` bitmask instead.

- `Event.seatsRemaining` is a **denormalized counter**, not computed by
  summing `Booking.seats` on every read. This is the single most important
  design decision in the system - see the concurrency section below for why.

## 2. Concurrency: preventing overbooking

This is the one piece of real distributed-systems-flavored logic in the
project, so it's worth explaining in detail.

**The problem:** two attendees hit "book" on the last seat of an event at
the same instant. A naive implementation (`if seatsRemaining >= seats: seatsRemaining -= seats`)
has a classic check-then-act race: both requests can read
`seatsRemaining = 1` before either writes back, and both succeed, leaving
the count at `-1`.

**The fix implemented here:** every booking write happens inside a Sequelize
transaction that opens with `SELECT ... FOR UPDATE` on the target event row:

```js
await sequelize.transaction(async (t) => {
  const event = await Event.findByPk(eventId, { transaction: t, lock: t.LOCK.UPDATE });
  if (event.seatsRemaining < seats) throw ApiError.conflict(...);
  event.seatsRemaining -= seats;
  await event.save({ transaction: t });
  return Booking.create({...}, { transaction: t });
});
```

`FOR UPDATE` takes a row-level lock on that specific event row for the
duration of the transaction. A second concurrent request for the *same*
event blocks at the `findByPk` line until the first transaction commits or
rolls back, then re-reads the now-updated `seatsRemaining` and evaluates
against fresh data. Requests for *different* events are unaffected - the
lock is per-row, not per-table.

This was validated with an actual concurrency test, not just reasoned about:
`tests/integration/bookings.test.js` fires 10 simultaneous booking requests
at an event with 3 seats and asserts exactly 3 succeed, 7 are rejected with
409, and the final `seatsRemaining` is exactly 0. This passes consistently
against a real Postgres instance (not mocked).

**Trade-off considered and rejected:** optimistic locking (a `version`
column, retry on conflict) instead of pessimistic row locks. Optimistic
locking scales better under high contention because it doesn't block
readers/writers against each other - but it pushes retry logic into every
caller and is harder to reason about correctness for a "hard cap" resource
like seat count, where you'd rather a request wait 50ms than have to retry
client-side. Given this is a course-grained, short-lived critical section
(a few milliseconds per booking), pessimistic locking is the simpler and
safer choice here. At genuinely high scale (thousands of bookings/second
for one event) I'd reach for a queue-based approach instead - see "What I'd
do differently at scale" below.

Cancellation follows the same pattern in reverse: the booking row is locked,
marked `cancelled`, and the event's `seatsRemaining` is incremented, all in
one transaction.

## 3. Error handling

Every thrown error in a controller either **is** an `ApiError` (a known,
expected condition - bad input, not found, forbidden) or gets normalized
into one by the central error handler. Sequelize-specific errors
(`SequelizeUniqueConstraintError`, `SequelizeValidationError`,
`SequelizeForeignKeyConstraintError`) are translated into the same
`{ success, error: { message, details } }` shape so API consumers never see
an ORM's internal error format. Unexpected (non-operational) errors are
logged server-side with full detail but return a generic 500 to the client -
this avoids leaking stack traces or internal state in production while
still being debuggable from logs.

`catchAsync` wraps every controller so a rejected promise is forwarded to
Express's error middleware automatically, instead of every controller
needing its own `try/catch`.

## 4. Validation

Zod schemas live in `src/validators/`, one file per resource, each
exporting `{ body, query, params }` shapes as needed per route. A single
`validate(schema)` middleware factory applies whichever pieces are present.
I chose Zod over `express-validator`/Joi mainly for:

- Composable cross-field validation via `.refine()` (e.g. rejecting an event
  where `endTime <= startTime` in one place, not scattered checks)
- `z.coerce.number()` for query-string params, which arrive as strings
- The schema *is* the source of truth for shape, versus chained
  `.isEmail().notEmpty()` calls that describe validation but not structure

## 5. Why Sequelize (and hand-written migrations, not `sync()`)

`sequelize.sync({ alter: true })` is tempting for a small project but was
deliberately avoided even in this codebase, because it doesn't produce a
reviewable, reversible history of schema changes - which is the entire
point of the "real database" requirement for a portfolio project. Migrations
are hand-written (not CLI-generated with placeholder names) so the diff
between "what the model looks like" and "what actually happened to the
schema over time" stays honest, and `down()` methods are implemented for
every migration so `npm run migrate:undo` actually works.

## 6. Statelessness / JWT

Auth is JWT-in-header, not cookie/session based. No session store means the
API can be scaled horizontally behind a load balancer with zero shared
state (aside from the database itself). The trade-off is that there's no
built-in server-side token revocation - a stolen token is valid until it
expires. For this project's scope (7-day expiry, `JWT_SECRET` rotation
possible) that's an acceptable trade-off; a production system handling
something more sensitive would add a token-blocklist (Redis) or move to
shorter-lived access tokens + refresh tokens.

## A note on scope for this submission

An earlier iteration of this project also included Stripe payments (a
checkout flow that reserves seats before payment and only confirms via a
signature-verified webhook), a waitlist with auto-promotion, and a
Redis-backed background job queue (BullMQ) for async email notifications
and payment-hold expiry. All of it was built and fully tested - 52 passing
integration tests, including one that ran a real BullMQ worker against real
Redis, and webhook tests using genuine HMAC-SHA256 signature verification
(not mocked).

That code is preserved under [`../future-work/`](../future-work/) rather
than deleted. It was set aside for this submission specifically to keep
local setup down to a single dependency (Postgres) ahead of a deadline -
not because any of it was broken or incomplete. See
`future-work/README.md` for what's there and how to wire it back in.

## 7. What I'd do differently at scale

- **Booking queue instead of a DB lock** for extremely high-contention
  events (e.g. a flash sale for a small number of seats hit by tens of
  thousands of requests/second): push booking *requests* onto a queue
  (SQS/BullMQ) and process them serially per-event, returning a
  "pending/confirmed/rejected" status the client polls for, instead of
  holding a Postgres row lock under that much concurrent load.
- **Read replicas** for the public `GET /api/events` list, since reads
  vastly outnumber writes on a browsing-heavy platform like this.
- **Redis cache** for the events list with short TTL + cache-busting on
  write, rather than hitting Postgres for every browse request.
- **Soft deletes** (`deletedAt` / `paranoid: true` in Sequelize) instead of
  hard deletes on `Event`, so historical bookings against a deleted event
  remain queryable for receipts/support. *(Implemented - see `Event` model.)*
- **Idempotency keys on write endpoints** (e.g. `POST /bookings`) - a
  retried network call could currently create two bookings instead of one
  being recognized as a duplicate. A production version would accept an
  `Idempotency-Key` header and short-circuit to the existing booking if one
  already exists for that key.
- **Object storage for uploads** instead of local disk (see the note in
  `middleware/upload.js`) - required as soon as there's more than one API
  instance, since local disk isn't shared across containers/instances.
- **Separate worker queues per job type with different concurrency limits**
  - the `future-work/` background-job implementation runs email and
  payment-expiry jobs as two BullMQ `Worker`s sharing one process; at real
  scale you'd run dedicated worker fleets per queue so a burst of one job
  type can't starve the other.
