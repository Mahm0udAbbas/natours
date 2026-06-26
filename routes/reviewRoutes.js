const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  setTourUserIds,
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
    setTourUserIds,
    createReview,
  );
router
  .route('/:id')
  .get(getReview)
  .patch(
    protect,
    restrictTo('user', 'admin'),
    validateReviewId,
    validateUpdateReview,
    updateReview,
  )
  .delete(protect, restrictTo('user', 'admin'), deleteReview);

module.exports = router;
