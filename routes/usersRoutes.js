const express = require('express');

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
} = require('../validators/userValidators');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/forgotPassword', validateForgotPassword, forgotPassword);
router.patch('/resetPassword/:token', validateResetPassword, resetPassword);

router.use(protect);

router.patch('/updatePassword', validateUpdatePassword, updatePassword);
router.patch(
  '/updateMe',
  uploadUserPhoto,
  resizeUserPhoto,
  validateUpdateMe,
  updateMe,
);
router.delete('/deleteMe', deleteMe);
router.get('/me', getMe, getUser);

router.use(protect, restrictTo('admin'));
//User Routes
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
