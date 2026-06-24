const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  const tour = req.params.tourId || req.body.tour;

  if (!tour) {
    return next(new AppError('A review must belong to a tour', 400));
  }

  req.body.tour = tour;
  req.body.user = req.user.id;

  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
