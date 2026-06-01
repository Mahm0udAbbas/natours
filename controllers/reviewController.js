const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // 1 ) get Reviews all reviews
  const reviews = await Review.find();

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
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
