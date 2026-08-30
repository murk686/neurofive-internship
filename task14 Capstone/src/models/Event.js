module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'Event',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organizer_id',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_time',
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'end_time',
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      seatsRemaining: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'seats_remaining',
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'cancelled'),
        allowNull: false,
        defaultValue: 'published',
      },
      coverImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'cover_image_url',
      },
    },
    {
      tableName: 'events',
      underscored: true,
      timestamps: true,
      paranoid: true, // soft delete: destroy() sets deleted_at instead of removing the row,
      // so historical bookings against a deleted event remain queryable (see ARCHITECTURE.md)
    }
  );

  return Event;
};
