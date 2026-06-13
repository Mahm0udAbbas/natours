const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // 1 ) get Reviews all reviews
  const reviews = await Review.find(filter);

  // 2) send response to client
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  // 1) get the review by id
  const review = await Review.findById(req.params.id);
  // 2) check for no review found with that id
  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  // 2) send response to the client
  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const tour = req.params.tourId || req.body.tour;

  if (!tour) {
    return next(new AppError('A review must belong to a tour', 400));
  }

  const newReview = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    tour,
    user: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const filter = {
    _id: req.params.id,
    user: req.user.id,
  };

  if (req.params.tourId) filter.tour = req.params.tourId;

  const updatedReview = await Review.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedReview) {
    return next(
      new AppError('No review found with that ID for this user', 404),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      review: updatedReview,
    },
  });
});
