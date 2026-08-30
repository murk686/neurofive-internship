'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('waitlist_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      seats: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM('waiting', 'promoted', 'cancelled'),
        allowNull: false,
        defaultValue: 'waiting',
      },
      promoted_booking_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'bookings', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('waitlist_entries', ['event_id', 'status', 'created_at']);
    await queryInterface.addIndex('waitlist_entries', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('waitlist_entries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_waitlist_entries_status";');
  },
};
