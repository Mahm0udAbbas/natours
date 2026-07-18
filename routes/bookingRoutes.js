const express = require('express');
const controller = require('../controllers/bookingController');
const { protect, restrictTo } = require('../controllers/authController');
const {
  validateCheckout,
  validateBookingId,
} = require('../validators/bookingValidators');

const router = express.Router();
router.use(protect);
router.post(
  '/checkout-session',
  validateCheckout,
  controller.createCheckoutSession,
);
router.get('/me', controller.getMyBookings);

router.use(restrictTo('admin', 'lead-guide'));
router.get('/', controller.getAllBookings);
router.get('/:id', validateBookingId, controller.getBooking);
router.post(
  '/:id/refund',
  validateBookingId,
  restrictTo('admin'),
  controller.refundBooking,
);

module.exports = router;
