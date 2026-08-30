'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Postgres requires ADD VALUE to run outside a transaction block.
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_bookings_status\" ADD VALUE IF NOT EXISTS 'pending_payment';"
    );
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_bookings_status\" ADD VALUE IF NOT EXISTS 'expired';"
    );

    await queryInterface.addColumn('bookings', 'stripe_payment_intent_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('bookings', 'payment_hold_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('bookings', 'payment_hold_expires_at');
    await queryInterface.removeColumn('bookings', 'stripe_payment_intent_id');
    // Note: Postgres does not support removing enum values; down() leaves
    // 'pending_payment'/'expired' in the type, which is harmless if unused.
  },
};
