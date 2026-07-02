const AppError = require('../utils/appError');

// Handle invalid ID error in MongoDB
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Handle duplicate fields error in MongoDB
const handleDuplicateFieldDB = (err) => {
  const value = Object.values(err.keyValue || {})[0] || 'unknown';

  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

// Handle validation error in MongoDB
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = errors.join('. ');
  return new AppError(message, 400);
};

// Handle JWT error
const handleJWTError = () =>
  new AppError('Invalid Token! , Please login again', 401);
const handleJWTExpiredError = () =>
  new AppError('Invalid your token is Expired! , Please login again', 401);

// Send error in development environment
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

//  Send error in production environment
const sendErrorProd = (err, res) => {
  // Operational error   , trusted error, send message to client\

  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error, don't leak error details to client
    console.error('ERROR ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// Global error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (['production', 'test'].includes(process.env.NODE_ENV)) {
    let error = err;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (
      error.code === 11000 ||
      (error.errorResponse && error.errorResponse.code === 11000)
    ) {
      error = handleDuplicateFieldDB(error);
    }

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
