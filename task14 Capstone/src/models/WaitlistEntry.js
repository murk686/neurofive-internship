module.exports = (sequelize, DataTypes) => {
  const WaitlistEntry = sequelize.define(
    'WaitlistEntry',
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
      status: {
        type: DataTypes.ENUM('waiting', 'promoted', 'cancelled'),
        allowNull: false,
        defaultValue: 'waiting',
      },
      promotedBookingId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'promoted_booking_id',
      },
    },
    {
      tableName: 'waitlist_entries',
      underscored: true,
      timestamps: true,
    }
  );

  return WaitlistEntry;
};
