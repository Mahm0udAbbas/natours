const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const crypto = require('crypto');
const compression = require('compression');

const toursRouter = require('./routes/toursRoutes');
const usersRouter = require('./routes/usersRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewsRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const { webhook } = require('./controllers/bookingController');
const health = require('./controllers/healthController');

// Start express app
const app = express();
app.set('trust proxy', 1);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.assetUrl = (value, folder) =>
  /^https?:\/\//.test(value || '') ? value : `/img/${folder}/${value}`;

//--- Global Middlewares ---
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set query parser to 'extended' to support nested query parameters
app.set('query parser', 'extended');
app.use((req, res, next) => {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', req.id);
  next();
});
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const startedAt = Date.now();
    res.on('finish', () => {
      process.stdout.write(
        `${JSON.stringify({
          level: 'info',
          event: 'request',
          requestId: req.id,
          method: req.method,
          path: req.originalUrl.split('?')[0],
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        })}\n`,
      );
    });
  }
  next();
});
app.use(compression());

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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: [
          "'self'",
          'data:',
          'https://tile.openstreetmap.org',
          'https://*.tile.openstreetmap.org',
          'https://ik.imagekit.io',
        ],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        frameSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://hooks.stripe.com',
        ],
      },
    },
  }),
);

// Stripe must receive the exact bytes that were signed.
app.post(
  '/api/v1/booking/webhook',
  express.raw({ type: 'application/json' }),
  webhook,
);

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);

// Cookie parser, reading cookies into req.cookies
app.use(cookieParser());

// Cookie-authenticated mutations must originate from this application.
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.cookies.jwt &&
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  ) {
    const origin = req.get('origin');
    const expected = process.env.APP_URL && new URL(process.env.APP_URL).origin;
    if (!origin || origin !== expected) {
      return next(new AppError('Invalid request origin', 403));
    }
  }
  next();
});

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

app.get('/health/live', health.live);
app.get('/health/ready', health.ready);

app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/booking', bookingRouter);

// Handle unhandled routes
app.all('*splat', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
