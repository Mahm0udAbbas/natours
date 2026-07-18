const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const Departure = require('../models/departureModel');
const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const STAFF_PAGE_SIZE = 10;

const getPage = (value) => Math.max(Number.parseInt(value, 10) || 1, 1);

const getPagination = (page, total) => ({
  page,
  total,
  totalPages: Math.max(Math.ceil(total / STAFF_PAGE_SIZE), 1),
  pageSize: STAFF_PAGE_SIZE,
});

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
  const page = getPage(req.query.page);
  const [tours, total] = await Promise.all([
    Tour.find()
      .sort('name')
      .skip((page - 1) * STAFF_PAGE_SIZE)
      .limit(STAFF_PAGE_SIZE),
    Tour.countDocuments(),
  ]);
  res.status(200).render('staffManage', {
    title: 'Manage tours',
    kind: 'tours',
    items: tours,
    pagination: getPagination(page, total),
  });
});

exports.getStaffDepartures = catchAsync(async (req, res) => {
  const page = getPage(req.query.page);
  const [departures, tours, total] = await Promise.all([
    Departure.find()
      .populate('tour', 'name')
      .sort('startDate')
      .skip((page - 1) * STAFF_PAGE_SIZE)
      .limit(STAFF_PAGE_SIZE),
    Tour.find().select('name'),
    Departure.countDocuments(),
  ]);
  res.status(200).render('staffManage', {
    title: 'Manage departures',
    kind: 'departures',
    items: departures,
    tours,
    pagination: getPagination(page, total),
  });
});

exports.getStaffBookings = catchAsync(async (req, res) => {
  const page = getPage(req.query.page);
  const [bookings, total] = await Promise.all([
    Booking.find()
      .sort('-createdAt')
      .skip((page - 1) * STAFF_PAGE_SIZE)
      .limit(STAFF_PAGE_SIZE),
    Booking.countDocuments(),
  ]);
  res.status(200).render('staffManage', {
    title: 'Manage bookings',
    kind: 'bookings',
    items: bookings,
    pagination: getPagination(page, total),
  });
});

exports.getStaffUsers = catchAsync(async (req, res) => {
  const page = getPage(req.query.page);
  const [users, total] = await Promise.all([
    User.find()
      .sort('name')
      .skip((page - 1) * STAFF_PAGE_SIZE)
      .limit(STAFF_PAGE_SIZE),
    User.countDocuments(),
  ]);
  res.status(200).render('staffManage', {
    title: 'Manage users',
    kind: 'users',
    items: users,
    pagination: getPagination(page, total),
  });
});

exports.getStaffReviews = catchAsync(async (req, res) => {
  const page = getPage(req.query.page);
  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('tour', 'name')
      .sort('-createdAt')
      .skip((page - 1) * STAFF_PAGE_SIZE)
      .limit(STAFF_PAGE_SIZE),
    Review.countDocuments(),
  ]);
  res.status(200).render('staffManage', {
    title: 'Manage reviews',
    kind: 'reviews',
    items: reviews,
    pagination: getPagination(page, total),
  });
});

exports.getInfoPage = (req, res) => {
  const pages = {
    about: {
      title: 'About us',
      eyebrow: 'Our story',
      heading: 'Travel deeper. Come home different.',
      intro:
        'Natours creates thoughtfully planned small-group adventures that connect curious travelers with remarkable places and local people.',
      sections: [
        [
          'Why we travel',
          'We believe the best trips make room for discovery, genuine connection, and stories worth retelling.',
        ],
        [
          'How we explore',
          'Our tours balance iconic landscapes with unhurried local moments, led by experienced guides who know every trail.',
        ],
        [
          'Our promise',
          'Clear prices, carefully selected departures, and helpful support from booking to the journey home.',
        ],
      ],
    },
    terms: {
      title: 'Terms & conditions',
      eyebrow: 'The essentials',
      heading: 'Simple terms for confident adventures.',
      intro:
        'These terms explain the rules that apply when you browse Natours, create an account, or reserve a tour.',
      sections: [
        [
          'Bookings and payment',
          'A booking is confirmed after successful payment and confirmation. Prices, capacity, and departure availability may change before checkout.',
        ],
        [
          'Changes and cancellations',
          'Cancellation, refund, and itinerary terms depend on the departure and will be shown during booking. We may adjust an itinerary when safety or local conditions require it.',
        ],
        [
          'Traveler responsibilities',
          'Travelers are responsible for accurate account details, required documents, suitable insurance, and following guide safety instructions.',
        ],
      ],
    },
    privacy: {
      title: 'Privacy policy',
      eyebrow: 'Your privacy',
      heading: 'Your information deserves respect.',
      intro:
        'We use the minimum information needed to manage accounts, bookings, payments, reviews, and customer support.',
      sections: [
        [
          'Information we collect',
          'We collect details you provide, booking activity, and necessary technical information used to keep the service secure.',
        ],
        [
          'How it is used',
          'Information supports trip fulfillment, account security, service messages, and improvements to the Natours experience.',
        ],
        [
          'Your choices',
          'You can update your profile from your account and contact us about access, correction, or deletion requests.',
        ],
      ],
    },
    contact: {
      title: 'Contact',
      eyebrow: 'We are here to help',
      heading: 'Let’s plan something unforgettable.',
      intro:
        'Questions about a tour, an existing booking, or joining our guide team? Our adventure specialists are ready to help.',
      sections: [
        [
          'Trip support',
          'Email hello@natours.com for tour and booking questions.',
        ],
        [
          'Office hours',
          'Monday to Friday, 9:00–18:00. We prioritize messages about upcoming departures.',
        ],
        [
          'Work with us',
          'Guide and partnership enquiries are welcome at partners@natours.com.',
        ],
      ],
    },
  };
  const pageKey = req.path.slice(1);
  const page = pages[pageKey];
  if (!page) {
    return res.status(404).render('error', {
      title: 'Not found',
      msg: 'This page does not exist.',
    });

  }
  return res.status(200).render('infoPage', { ...page, pageKey });
};

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
