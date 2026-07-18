const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  const tour = req.params.tourId || req.body.tour;
  if (!tour) return next(new AppError('A review must belong to a tour', 400));
  req.body.tour = tour;
  req.body.user = req.user.id;
  next();
};

exports.requirePaidBooking = catchAsync(async (req, res, next) => {
  const eligible = await Booking.exists({
    tour: req.body.tour,
    user: req.user.id,
    status: 'paid',
  });
  if (!eligible) {
    return next(
      new AppError('Only verified customers can review this tour', 403),
    );
  }
  next();
});

const ownedReview = async (req) => {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') query.user = req.user.id;
  return Review.findOne(query);
};

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await ownedReview(req);
  if (!review)
    return next(new AppError('No review found or access denied', 404));
  Object.assign(review, req.body);
  await review.save();
  res.status(200).json({ status: 'success', data: { data: review } });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await ownedReview(req);
  if (!review)
    return next(new AppError('No review found or access denied', 404));
  await review.deleteOne();
  await Review.calcAverageRatings(review.tour);
  res.status(204).json({ status: 'success', data: null });
});

exports.getMyReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ user: req.user.id }).populate({
    path: 'tour',
    select: 'name slug imageCover',
  });
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { data: reviews },
  });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
