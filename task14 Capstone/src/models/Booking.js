module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'event_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_price',
      },
      status: {
        // 'pending_payment': seats reserved, awaiting Stripe confirmation (paid checkout flow)
        // 'confirmed': booked and paid (or a free/direct booking, which skips payment)
        // 'cancelled': cancelled by the attendee
        // 'expired': payment hold timed out before completion; seats released
        type: DataTypes.ENUM('confirmed', 'cancelled', 'pending_payment', 'expired'),
        allowNull: false,
        defaultValue: 'confirmed',
      },
      stripePaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'stripe_payment_intent_id',
      },
      paymentHoldExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'payment_hold_expires_at',
      },
    },
    {
      tableName: 'bookings',
      underscored: true,
      timestamps: true,
    }
  );

  return Booking;
};
