const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  setTourUserIds,
  requirePaidBooking,
  getMyReviews,
} = require('../controllers/reviewController');
const {
  validateCreateReview,
  validateReviewId,
  validateReviewTourId,
  validateUpdateReview,
} = require('../validators/reviewValidators');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.get('/me', protect, getMyReviews);

router
  .route('/')
  .get(getAllReviews)
  .post(
    protect,
    restrictTo('user'),
    validateReviewTourId,
    validateCreateReview,
    setTourUserIds,
    requirePaidBooking,
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
  .delete(protect, restrictTo('user', 'admin'), validateReviewId, deleteReview);

module.exports = router;
