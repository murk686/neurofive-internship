'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      organizer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(50), allowNull: false },
      location: { type: Sequelize.STRING(200), allowNull: false },
      start_time: { type: Sequelize.DATE, allowNull: false },
      end_time: { type: Sequelize.DATE, allowNull: false },
      capacity: { type: Sequelize.INTEGER, allowNull: false },
      seats_remaining: { type: Sequelize.INTEGER, allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'cancelled'),
        allowNull: false,
        defaultValue: 'published',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('events', ['category']);
    await queryInterface.addIndex('events', ['location']);
    await queryInterface.addIndex('events', ['start_time']);
    await queryInterface.addIndex('events', ['organizer_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_status";');
  },
};
