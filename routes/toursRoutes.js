const express = require('express');
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getToursStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const {
  validateTourId,
  validateCreateTour,
  validateUpdateTour,
} = require('../validators/tourValidators');
const reviewsRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewsRouter);

// router.param('id', checkId);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getToursStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);
router
  .route('/')
  .get(getAllTours)
  .post(
    protect,
    restrictTo('admin', 'lead-guide'),
    validateCreateTour,
    createTour,
  );
router
  .route('/:id')
  .get(validateTourId, getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    validateTourId,
    validateUpdateTour,
    updateTour,
  )
  .delete(
    protect,
    restrictTo('admin', 'lead-guide'),
    validateTourId,
    deleteTour,
  );

module.exports = router;
