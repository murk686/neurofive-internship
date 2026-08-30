# Event Booking API

A production-ready backend for an event booking platform. Organizers publish
events; attendees browse, search, and book seats. Built with Node.js,
Express, PostgreSQL, and Sequelize.

**Live demo:** `<add your deployed URL here>`
**API docs (Swagger UI):** `<deployed URL>/api/docs`
**Video walkthrough:** `<add your LinkedIn video link here>`

---

## Features

- **Auth:** JWT-based signup/login, bcrypt password hashing, protected routes
- **Role-based access control:** `attendee` vs `organizer` roles, enforced on
  event creation/edit/delete, cover image upload, and the organizer's
  booking-list view
- **Two related resources:** `Event` (organizer-owned, soft deletable) and
  `Booking` (attendee-owned, references an Event), full CRUD on both
- **Concurrency-safe booking:** seat allocation uses a row-level lock inside
  a DB transaction so simultaneous booking requests can never oversell an
  event's capacity (see [Architecture](docs/ARCHITECTURE.md#concurrency))
- **File uploads:** event cover images (multer, validated, served statically)
- **Soft deletes:** deleted events disappear from listings but stay
  queryable for historical bookings/receipts
- **Validation:** every route validated with Zod, consistent error shape
- **Pagination, filtering, search:** on the events list (`category`,
  `location`, `search`, date range, sort)
- **Rate limiting:** global limiter + a stricter one on auth endpoints
- **API docs:** full OpenAPI 3.0 spec served via Swagger UI at `/api/docs`
- **Dockerized:** one-command local setup with `docker-compose` (Postgres + API)
- **CI/CD:** GitHub Actions runs lint + the full test suite against a real
  Postgres service container, then verifies the Docker image builds, on
  every push/PR
- **36 integration tests** (Jest + Supertest) against a real Postgres
  database, including an automated concurrency/race-condition test

> **Note:** an earlier iteration of this project also included Stripe
> payments, a waitlist with auto-promotion, and a Redis-backed background
> job queue for email notifications. That code is preserved (not deleted)
> under [`future-work/`](future-work/) with notes on what it does and how
> to wire it back in - it was set aside for this submission to keep local
> setup to a single dependency (Postgres), not because it doesn't work.

---

## Quick Start

### Option A — Docker (recommended, one command)

```bash
git clone <your-repo-url>
cd event-booking-api
cp .env.example .env        # edit JWT_SECRET at minimum
docker compose up --build
```

The API is at `http://localhost:3000`, migrations run automatically on
container start, and docs are at `http://localhost:3000/api/docs`.

### Option B — Local Node + local Postgres

```bash
git clone <your-repo-url>
cd event-booking-api
npm install
cp .env.example .env         # fill in DB_* vars + JWT_SECRET
createdb eventbooking_dev    # or use your preferred Postgres client
npm run migrate
npm run seed                 # optional: adds 2 demo users + 2 demo events
npm run dev
```

Visit `http://localhost:3000/api/docs` for interactive API docs.

### Running tests

```bash
createdb eventbooking_test
cp .env.example .env.test    # point DB_NAME at eventbooking_test
npm test
```

### Demo credentials (after `npm run seed`)

| Role      | Email               | Password    |
|-----------|----------------------|-------------|
| Organizer | organizer@demo.com  | password123 |
| Attendee  | attendee@demo.com   | password123 |

---

## API Overview

Full interactive documentation lives at `/api/docs` (Swagger UI), generated
from [`docs/openapi.yaml`](docs/openapi.yaml). Summary:

| Method | Endpoint                    | Auth              | Description                                  |
|--------|------------------------------|-------------------|-----------------------------------------------|
| POST   | `/api/auth/signup`          | Public            | Create an account                             |
| POST   | `/api/auth/login`           | Public            | Log in, receive a JWT                         |
| GET    | `/api/auth/me`               | Bearer token      | Current user profile                          |
| GET    | `/api/events`                | Public            | List events (pagination/filter/search)        |
| GET    | `/api/events/:id`            | Public            | Get one event                                 |
| POST   | `/api/events`                | **organizer**     | Create an event                               |
| PUT    | `/api/events/:id`            | **organizer**, owner only | Update an event                        |
| DELETE | `/api/events/:id`            | **organizer**, owner only | Soft-delete an event                   |
| POST   | `/api/events/:id/cover-image`| **organizer**, owner only | Upload a cover image (multipart)       |
| POST   | `/api/events/:id/bookings`   | Bearer token      | Book seats (any authenticated user)           |
| GET    | `/api/events/:id/bookings`   | **organizer**, owner only | View all bookings for an event         |
| GET    | `/api/bookings/me`           | Bearer token      | The caller's own bookings                     |
| DELETE | `/api/bookings/:id`          | Bearer token, owner only | Cancel a booking (restores seats)       |

**Roles gated on 4 endpoints:** `POST/PUT/DELETE /api/events` and
`POST /api/events/:id/cover-image` require the `organizer` role, and
`GET /api/events/:id/bookings` requires the caller to both be an
`organizer` and own the event.

### Example: sign up, create an event, book it

```bash
# 1. Sign up as an organizer
curl -X POST localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"password123","role":"organizer"}'

# 2. Create an event (use the token from step 1)
curl -X POST localhost:3000/api/events \
  -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Node Meetup","category":"tech","location":"Karachi","startTime":"2026-12-01T10:00:00Z","endTime":"2026-12-01T12:00:00Z","capacity":50,"price":10}'

# 3. Book seats (as an attendee token)
curl -X POST localhost:3000/api/events/<EVENT_ID>/bookings \
  -H "Content-Type: application/json" -H "Authorization: Bearer <ATTENDEE_TOKEN>" \
  -d '{"seats":2}'
```

### Response shape

All responses follow one consistent envelope:

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 42 } }
```

```json
{ "success": false, "error": { "message": "...", "details": [ { "field": "email", "message": "..." } ] } }
```

---

## Project Structure

```
src/
  config/       Sequelize connection + CLI config (supports DATABASE_URL or DB_* vars)
  models/       Sequelize models (User, Event, Booking) + associations.
                (A WaitlistEntry model/table also exists from the
                future-work waitlist feature - present in the schema,
                just not wired into any active route.)
  migrations/   Hand-written, reversible schema migrations
  seeders/      Demo data seeder
  middleware/   auth (JWT + RBAC), validate (Zod), errorHandler, rateLimiter, upload (multer)
  validators/   Zod schemas per resource
  controllers/  Route handlers / business logic
  routes/       Express routers
  utils/        ApiError, catchAsync, jwt helpers, pagination helper
  app.js        Express app assembly (no listen - imported by server.js and tests)
  server.js     Boots the app, connects DB, graceful shutdown
tests/
  integration/  Jest + Supertest, one file per resource
  helpers.js    Shared test factories (users, events)
  setup.js      DB cleanup between tests
docs/
  openapi.yaml    Full OpenAPI 3.0 spec (served at /api/docs)
  ARCHITECTURE.md Design decisions and trade-offs
.github/workflows/
  ci.yml          Lint + test (real Postgres service container) + Docker build check
future-work/
  Stripe payments, waitlist auto-promotion, and a Redis-backed background
  job queue - built and fully tested (52 passing tests, including one that
  ran a real worker against real Redis) in an earlier iteration, set aside
  for this submission to keep local setup to one dependency (Postgres).
  Not wired into the running app - see future-work/README.md.
```

---

## Architecture Decisions (summary)

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full write-up.
Highlights:

- **Sequelize + hand-written migrations** over a schemaless approach, because
  events/bookings/capacity are inherently relational and benefit from
  foreign keys and transactions.
- **Row-level locking (`SELECT ... FOR UPDATE`) inside a transaction** for
  seat booking, instead of an optimistic-locking / retry approach - simpler
  to reason about correctly for a course-grained resource like "seats left
  on this event," at the cost of briefly serializing writes to the same row
  under heavy contention.
- **Zod over Joi/express-validator** for schema validation - type inference
  and composable `.refine()` cross-field checks (e.g. `endTime > startTime`).
- **A single `app.js`/`server.js` split** so the Express app can be imported
  directly into Supertest without binding a real port during tests.
- **JWT stored client-side, not sessions** - keeps the API stateless, which
  matters for horizontal scaling behind a load balancer.

---

## Stretch Goals Implemented

- ✅ Pagination, filtering, and search (`/api/events`)
- ✅ Rate limiting (global + stricter on auth)
- ✅ Docker + docker-compose (one-command local environment)
- ✅ File uploads (event cover images, validated, served statically)
- ✅ CI/CD pipeline (GitHub Actions - lint + tests against a real Postgres
  service container, then a Docker build check)

(Payments, a waitlist, and a background job queue were also built and
fully tested - see [`future-work/`](future-work/) - but set aside for this
submission; the five above are what's live in the running app.)

## Environment Variables

See [`.env.example`](.env.example) for the full list. At minimum you must
set `JWT_SECRET` before deploying. Most PaaS providers (Render, Railway)
inject a single `DATABASE_URL` - the app detects and uses it automatically
in place of the discrete `DB_*` vars.

## License

MIT
