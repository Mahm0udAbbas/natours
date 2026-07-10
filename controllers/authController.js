const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../services/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookiesOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: 'lax',
  };
  if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;
  res.cookie('jwt', token, cookiesOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcomeEmail();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1- check password and email
  if (!email || !password) {
    return next(new AppError('Please enter your email and password', 400));
  }
  // 2- check user exist and then verify the password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3- send token to the user
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.clearCookie('jwt', cookieOptions);
  res.status(200).json({ status: 'success' });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body || !req.body.email) {
    return next(new AppError('please provide you email address', 400));
  }

  // 1) get the user using the email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Gernerate the reset password token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to the user's email
  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email!',
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error send the email , please try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  if (!req.body || !req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError(
        'Please provide both password and passwordConfirm in the request body',
        400,
      ),
    );
  }

  // 1)  Get user based on the reset token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpire: { $gt: Date.now() },
  });

  // 2) if token has not expired , and there is user , set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired ', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  await user.save();

  // 3) Update teh changedPasswordAt property for the user in the userModel
  // this is done in the userModel using a pre save middleware
  // 4) log the user in , send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  if (!req.body || !req.body.currentPassword) {
    return next(new AppError('Please enter your current password', 400));
  }

  if (!req.body || !req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError('Please enter your new password and password confirm', 400),
    );
  }

  const user = await User.findById(req.user.id).select('+password');
  // 2) check if POSted current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) if so , update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log in the user , send JWT
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Your are not logged in, please login to access', 401),
    );
  }

  // 2) Token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if  user still existes
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'this user  blonging to this token dose not exist!, please login again',
        401,
      ),
    );
  }

  // 4) if the user change their password
  if (await freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed his password! Please login again',
        401,
      ),
    );
  }

  // GRANT ACCESS TO  PROTECTED ROUTES
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

// only for rendered pages , no errors
exports.isLoggedin = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it is there
  let token;
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;

    // 2) Token verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if  user still existes
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next();
    }

    // 4) if the user change their password
    if (await freshUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // There is a logged in user
    res.locals.user = freshUser;
    return next();
  }
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
