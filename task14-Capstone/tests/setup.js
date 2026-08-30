const { sequelize } = require('../src/models');

// Runs once after all tests in a file finish - release the DB handle so
// Jest can exit cleanly instead of hanging on an open connection.
afterAll(async () => {
  await sequelize.close();
});

// Truncate all tables between tests so each test starts from a clean slate,
// without paying the cost of re-running migrations every time.
afterEach(async () => {
  const { User, Event, Booking, WaitlistEntry } = require('../src/models');
  await WaitlistEntry.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await Event.destroy({ where: {}, force: true, paranoid: false });
  await User.destroy({ where: {}, force: true });
});
