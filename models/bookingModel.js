const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A booking must have a tour'],
    },
    departure: {
      type: mongoose.Schema.ObjectId,
      ref: 'Departure',
      required: [true, 'A booking must have a departure'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A booking must have a user'],
    },
    seats: { type: Number, required: true, min: 1, max: 10 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded'],
      default: 'pending',
    },
    reservationExpiresAt: Date,
    stripeSessionId: { type: String, sparse: true, unique: true },
    stripePaymentIntentId: { type: String, sparse: true, unique: true },
    receiptUrl: String,
    paidAt: Date,
    refundedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ departure: 1, status: 1 });
bookingSchema.index({ status: 1, reservationExpiresAt: 1 });

bookingSchema.pre(/^find/, function () {
  this.populate({ path: 'user', select: 'name email photo' })
    .populate({ path: 'tour', select: 'name slug imageCover' })
    .populate({ path: 'departure', select: 'startDate capacity status' });
});

module.exports = mongoose.model('Booking', bookingSchema);
