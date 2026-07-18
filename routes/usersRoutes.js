const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
  prepareUserPhotoValidation,
} = require('../controllers/userController');
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require('../controllers/authController');
const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword,
  validateUpdateMe,
  validateAdminCreateUser,
  validateAdminUpdateUser,
} = require('../validators/userValidators');

const router = express.Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many authentication attempts' },
});

router.post('/signup', authenticationLimiter, validateSignup, signup);
router.post('/login', authenticationLimiter, validateLogin, login);
router.post('/logout', logout);
router.post(
  '/forgotPassword',
  authenticationLimiter,
  validateForgotPassword,
  forgotPassword,
);
router.patch('/resetPassword/:token', validateResetPassword, resetPassword);

router.use(protect);

router.patch('/updatePassword', validateUpdatePassword, updatePassword);
router.patch(
  '/updateMe',
  uploadUserPhoto,
  prepareUserPhotoValidation,
  validateUpdateMe,
  resizeUserPhoto,
  updateMe,
);
router.delete('/deleteMe', deleteMe);
router.get('/me', getMe, getUser);

router.use(protect, restrictTo('admin'));
//User Routes
router.route('/').get(getAllUsers).post(validateAdminCreateUser, createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(validateAdminUpdateUser, updateUser)
  .delete(deleteUser);

module.exports = router;
