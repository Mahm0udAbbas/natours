const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const toursRouter = require('./routes/toursRoutes');
const usersRouter = require('./routes/usersRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Start express app
const app = express();

// Set query parser to 'extended' to support nested query parameters
app.set('query parser', 'extended');

//--- Global Middlewares ---

// Development logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// rate limit middleware
const limiter = rateLimit({
  max: 60,
  windowMs: 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour !',
});
app.use(limiter);

// Helmet middleware, Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);

// Cookie parser, reading cookies into req.cookies
app.use(cookieParser());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// ROUTES
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

// Handle unhandled routes
app.all('*splat', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
