const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getForgotPasswordForm,
  getResetPasswordForm,
  getAccount,
  getMyTours,
  getMyBookings,
  getMyReviews,
  getBookingResult,
  getStaffDashboard,
  getStaffTours,
  getStaffDepartures,
  getStaffBookings,
  getStaffUsers,
  getStaffReviews,
} = require('../controllers/viewsController');
const {
  isLoggedin,
  protect,
  restrictTo,
} = require('../controllers/authController');

const router = express.Router();
router.get('/', isLoggedin, getOverview);
router.get('/overview', isLoggedin, getOverview);
router.get('/tour/:slug', isLoggedin, getTour);
router.get('/login', isLoggedin, getLoginForm);
router.get('/signup', isLoggedin, getSignupForm);
router.get('/forgot-password', isLoggedin, getForgotPasswordForm);
router.get('/reset-password/:token', isLoggedin, getResetPasswordForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);
router.get('/my-bookings', protect, getMyBookings);
router.get('/my-reviews', protect, getMyReviews);
router.get('/booking/success', protect, getBookingResult);
router.use('/staff', protect);
router.get(
  '/staff',
  restrictTo('admin', 'lead-guide', 'guide'),
  getStaffDashboard,
);
router.get('/staff/tours', restrictTo('admin', 'lead-guide'), getStaffTours);
router.get(
  '/staff/departures',
  restrictTo('admin', 'lead-guide'),
  getStaffDepartures,
);
router.get(
  '/staff/bookings',
  restrictTo('admin', 'lead-guide'),
  getStaffBookings,
);
router.get('/staff/users', restrictTo('admin'), getStaffUsers);
router.get('/staff/reviews', restrictTo('admin'), getStaffReviews);

module.exports = router;
