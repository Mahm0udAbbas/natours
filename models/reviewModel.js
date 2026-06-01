const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      required: [true, 'Review must have a rating'],
      max: [5, 'Rating must be below 5.0'],
      min: [1, 'Rating must be above 1.0'],
    },
    createAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must be belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must be belong to a user'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// query middleware to populate the user and tour fields when getting reviews
reviewSchema.pre(/^find/, function () {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
