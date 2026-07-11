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
} = require('../controllers/viewsController');
const { isLoggedin, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();
router.get('/', createBookingCheckout, isLoggedin, getOverview);
router.get('/overview', isLoggedin, getOverview);
router.get('/tour/:slug', isLoggedin, getTour);
router.get('/login', isLoggedin, getLoginForm);
router.get('/signup', isLoggedin, getSignupForm);
router.get('/forgot-password', isLoggedin, getForgotPasswordForm);
router.get('/reset-password/:token', isLoggedin, getResetPasswordForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

module.exports = router;
