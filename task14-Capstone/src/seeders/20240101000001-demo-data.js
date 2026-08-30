'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

module.exports = {
  async up(queryInterface) {
    const organizerId = uuidv4();
    const attendeeId = uuidv4();
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: organizerId,
        name: 'Demo Organizer',
        email: 'organizer@demo.com',
        password_hash: DEMO_PASSWORD_HASH,
        role: 'organizer',
        created_at: now,
        updated_at: now,
      },
      {
        id: attendeeId,
        name: 'Demo Attendee',
        email: 'attendee@demo.com',
        password_hash: DEMO_PASSWORD_HASH,
        role: 'attendee',
        created_at: now,
        updated_at: now,
      },
    ]);

    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const inThreeWeeks = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('events', [
      {
        id: uuidv4(),
        organizer_id: organizerId,
        title: 'Node.js & PostgreSQL Deep Dive',
        description: 'A hands-on workshop covering backend architecture, auth, and databases.',
        category: 'tech',
        location: 'Karachi',
        start_time: inTwoWeeks,
        end_time: new Date(inTwoWeeks.getTime() + 3 * 60 * 60 * 1000),
        capacity: 50,
        seats_remaining: 50,
        price: 25.0,
        status: 'published',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        organizer_id: organizerId,
        title: 'Rooftop Jazz Night',
        description: 'Live jazz, good food, better company.',
        category: 'music',
        location: 'Lahore',
        start_time: inThreeWeeks,
        end_time: new Date(inThreeWeeks.getTime() + 4 * 60 * 60 * 1000),
        capacity: 30,
        seats_remaining: 30,
        price: 15.0,
        status: 'published',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('events', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
