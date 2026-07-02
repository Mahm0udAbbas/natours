const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get Tours Data
  const tours = await Tour.find({});
  // build the tours or overview page

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});
exports.getTour = catchAsync(async (req, res) => {
  // 1) Get the data for the requested tour
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      select: 'review rating user',
    })
    .populate({
      path: 'guides',
    });

  // 2) Build the tour page
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});
