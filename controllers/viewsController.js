const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const Departure = require('../models/departureModel');
const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.featured === 'true') filter.ratingsAverage = { $gte: 4.5 };
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 9;
  const sort = req.query.sort || '-ratingsAverage';
  const [tours, total] = await Promise.all([
    Tour.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Tour.countDocuments(filter),
  ]);
  // build the tours or overview page

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
    filters: req.query,
    pagination: { page, totalPages: Math.ceil(total / limit) },
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      select: 'review rating user',
    })
    .populate({
      path: 'guides',
    });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  const departures = await Departure.find({
    tour: tour.id,
    status: 'scheduled',
    startDate: { $gt: new Date() },
  }).sort('startDate');
  let canReview = false;
  let ownReview = null;
  if (res.locals.user) {
    [canReview, ownReview] = await Promise.all([
      Booking.exists({
        tour: tour.id,
        user: res.locals.user.id,
        status: 'paid',
      }),
      Review.findOne({ tour: tour.id, user: res.locals.user.id }),
    ]);
  }

  // 2) Build the tour page
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    departures,
    canReview: Boolean(canReview),
    ownReview,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id, status: 'paid' });

  const tourIds = bookings.map((booking) => booking.tour.id);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My  Tours',
    tours,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort('-createdAt');
  res
    .status(200)
    .render('bookings', { title: 'Billing and bookings', bookings });
});

exports.getMyReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ user: req.user.id }).populate({
    path: 'tour',
    select: 'name slug',
  });
  res.status(200).render('myReviews', { title: 'My reviews', reviews });
});

exports.getBookingResult = (req, res) =>
  res.status(200).render('bookingResult', {
    title: 'Payment received',
    success: true,
  });

exports.getStaffDashboard = catchAsync(async (req, res) => {
  const year = new Date().getFullYear();
  const [tourCount, departureCount, bookingStats, reviewCount, monthlyPlan] =
    await Promise.all([
      Tour.countDocuments(),
      Departure.countDocuments({
        status: 'scheduled',
        startDate: { $gt: new Date() },
      }),
      Booking.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            seats: { $sum: '$seats' },
          },
        },
      ]),
      Review.countDocuments(),
      Departure.aggregate([
        {
          $match: {
            startDate: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${year + 1}-01-01`),
            },
          },
        },
        { $group: { _id: { $month: '$startDate' }, departures: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
  res.status(200).render('staffDashboard', {
    title: 'Staff dashboard',
    cards: {
      tours: tourCount,
      departures: departureCount,
      revenue: bookingStats[0]?.revenue || 0,
      seats: bookingStats[0]?.seats || 0,
      reviews: reviewCount,
    },
    monthlyPlan,
  });
});

exports.getStaffTours = catchAsync(async (req, res) => {
  const tours = await Tour.find().sort('name');
  res.status(200).render('staffManage', {
    title: 'Manage tours',
    kind: 'tours',
    items: tours,
  });
});

exports.getStaffDepartures = catchAsync(async (req, res) => {
  const [departures, tours] = await Promise.all([
    Departure.find().populate('tour', 'name').sort('startDate'),
    Tour.find().select('name'),
  ]);
  res.status(200).render('staffManage', {
    title: 'Manage departures',
    kind: 'departures',
    items: departures,
    tours,
  });
});

exports.getStaffBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find().sort('-createdAt');
  res.status(200).render('staffManage', {
    title: 'Manage bookings',
    kind: 'bookings',
    items: bookings,
  });
});

exports.getStaffUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort('name');
  res.status(200).render('staffManage', {
    title: 'Manage users',
    kind: 'users',
    items: users,
  });
});

exports.getStaffReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find()
    .populate('tour', 'name')
    .sort('-createdAt');
  res.status(200).render('staffManage', {
    title: 'Manage reviews',
    kind: 'reviews',
    items: reviews,
  });
});

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
};

exports.getForgotPasswordForm = (req, res) => {
  res.status(200).render('forgotPassword', {
    title: 'Reset your password',
  });
};

exports.getResetPasswordForm = (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Choose a new password',
    token: req.params.token,
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};
