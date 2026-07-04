const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
} = require('../controllers/viewsController');
const { isLoggedin, protect } = require('../controllers/authController');

const router = express.Router();
router.get('/', isLoggedin, getOverview);
router.get('/overview', isLoggedin, getOverview);
router.get('/tour/:slug', isLoggedin, getTour);
router.get('/tour/:slug', isLoggedin, getTour);
router.get('/login', isLoggedin, getLoginForm);
router.get('/me', protect, getAccount);

module.exports = router;
