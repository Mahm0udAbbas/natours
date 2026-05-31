const express = require('express');

const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/userController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
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
router.post('/forgotPassword', validateForgotPassword, forgotPassword);
router.patch('/resetPassword/:token', validateResetPassword, resetPassword);
router.patch(
  '/updatePassword',
  protect,
  validateUpdatePassword,
  updatePassword,
);
router.patch('/updateMe', protect, validateUpdateMe, updateMe);
router.delete('/deleteMe', protect, deleteMe);

//User Routes
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
