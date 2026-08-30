const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const User = require('./User')(sequelize, DataTypes);
const Event = require('./Event')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);
const WaitlistEntry = require('./WaitlistEntry')(sequelize, DataTypes);

// ---- Associations ----
// A User can organize many Events
User.hasMany(Event, { foreignKey: 'organizerId', as: 'organizedEvents' });
Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

// An Event has many Bookings; a Booking belongs to one Event
Event.hasMany(Booking, { foreignKey: 'eventId', as: 'bookings', onDelete: 'CASCADE' });
Booking.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

// A User (attendee) can have many Bookings
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'attendee' });

// Waitlist: belongs to an Event and a User; optionally links to the
// Booking it was promoted into.
Event.hasMany(WaitlistEntry, { foreignKey: 'eventId', as: 'waitlistEntries', onDelete: 'CASCADE' });
WaitlistEntry.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

User.hasMany(WaitlistEntry, { foreignKey: 'userId', as: 'waitlistEntries' });
WaitlistEntry.belongsTo(User, { foreignKey: 'userId', as: 'attendee' });

WaitlistEntry.belongsTo(Booking, { foreignKey: 'promotedBookingId', as: 'promotedBooking' });

module.exports = { sequelize, User, Event, Booking, WaitlistEntry };
