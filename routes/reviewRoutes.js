const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
} = require('../controllers/reviewController');
const {
  validateCreateReview,
  validateReviewId,
  validateReviewTourId,
  validateUpdateReview,
} = require('../validators/reviewValidators');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReviews)
  .post(
    protect,
    restrictTo('user'),
    validateReviewTourId,
    validateCreateReview,
    createReview,
  );
router
  .route('/:id')
  .get(getReview)
  .patch(
    protect,
    restrictTo('user'),
    validateReviewId,
    validateUpdateReview,
    updateReview,
  );

module.exports = router;
