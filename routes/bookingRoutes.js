const express = require('express');

const {
  getCheckoutSession,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getBooking,
  createBooking,
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../controllers/authController');
const {
  validateBookingId,
  validateCheckoutTourId,
  validateCreateBooking,
  validateUpdateBooking,
} = require('../validators/bookingValidators');

const router = express.Router();

router.use(protect);
router.get(
  '/checkout-session/:tourId',
  validateCheckoutTourId,
  getCheckoutSession,
);

router.use(restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(getAllBookings)
  .post(validateCreateBooking, createBooking);
router
  .route('/:id')
  .get(validateBookingId, getBooking)
  .delete(validateBookingId, deleteBooking)
  .patch(validateBookingId, validateUpdateBooking, updateBooking);

module.exports = router;
