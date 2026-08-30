const request = require('supertest');
const { app, createUser, createEvent } = require('../helpers');

// Smallest possible valid PNG (1x1 transparent pixel), as a Buffer - avoids
// needing a fixture file on disk.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

describe('Event cover image upload', () => {
  it('allows the owning organizer to upload a cover image', async () => {
    const { token } = await createUser({ role: 'organizer' });
    const event = await createEvent(token, { title: 'Image Test Event' });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/cover-image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', TINY_PNG, 'cover.png');

    expect(res.status).toBe(200);
    expect(res.body.data.event.coverImageUrl).toMatch(/^\/uploads\/events\//);
  });

  it('rejects upload from a non-owning organizer', async () => {
    const owner = await createUser({ role: 'organizer' });
    const intruder = await createUser({ role: 'organizer' });
    const event = await createEvent(owner.token, { title: 'Owned Event' });

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/cover-image`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .attach('image', TINY_PNG, 'cover.png');

    expect(res.status).toBe(403);
  });

  it('rejects a request with no file attached', async () => {
    const { token } = await createUser({ role: 'organizer' });
    const event = await createEvent(token);

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/cover-image`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('rejects a non-image file', async () => {
    const { token } = await createUser({ role: 'organizer' });
    const event = await createEvent(token);

    const res = await request(app)
      .post(`/api/events/${event.body.data.event.id}/cover-image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not an image'), 'notes.txt');

    expect(res.status).toBe(400);
  });
});
