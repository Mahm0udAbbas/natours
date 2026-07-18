const mongoose = require('mongoose');

const departureSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A departure must belong to a tour'],
    },
    startDate: {
      type: Date,
      required: [true, 'A departure must have a start date'],
    },
    capacity: {
      type: Number,
      required: [true, 'A departure must have a capacity'],
      min: [1, 'Capacity must be at least one'],
    },
    reservedSeats: { type: Number, default: 0, min: 0 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

departureSchema.index({ tour: 1, startDate: 1 }, { unique: true });
departureSchema.index({ startDate: 1, status: 1 });

departureSchema.virtual('remainingCapacity').get(function () {
  return this.capacity - this.reservedSeats - this.bookedSeats;
});

module.exports = mongoose.model('Departure', departureSchema);
