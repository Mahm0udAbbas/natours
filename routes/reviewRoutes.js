const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
} = require('../controllers/reviewController');
const { validateCreateReview } = require('../validators/reviewValidators');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), validateCreateReview, createReview);
router.route('/:id').get(getReview);
module.exports = router;
