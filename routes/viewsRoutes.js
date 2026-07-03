const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
} = require('../controllers/viewsController');
const { isLoggedin } = require('../controllers/authController');

const router = express.Router();
router.use(isLoggedin);
router.get('/', getOverview);
router.get('/overview', getOverview);
router.get('/tour/:slug', getTour);
router.get('/login', getLoginForm);

module.exports = router;
