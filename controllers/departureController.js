const Departure = require('../models/departureModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.listDepartures = catchAsync(async (req, res) => {
  const departures = await Departure.find({ tour: req.params.tourId }).sort(
    'startDate',
  );
  res.status(200).json({
    status: 'success',
    results: departures.length,
    data: { data: departures },
  });
});

exports.createDeparture = catchAsync(async (req, res, next) => {
  if (!(await Tour.exists({ _id: req.params.tourId }))) {
    return next(new AppError('No tour found with that ID', 404));
  }
  const departure = await Departure.create({
    ...req.body,
    tour: req.params.tourId,
  });
  res.status(201).json({ status: 'success', data: { data: departure } });
});

exports.updateDeparture = catchAsync(async (req, res, next) => {
  const departure = await Departure.findOne({
    _id: req.params.departureId,
    tour: req.params.tourId,
  });
  if (!departure) return next(new AppError('No departure found', 404));
  if (
    req.body.capacity !== undefined &&
    req.body.capacity < departure.bookedSeats + departure.reservedSeats
  ) {
    return next(new AppError('Capacity cannot be below allocated seats', 400));
  }
  Object.assign(departure, req.body);
  await departure.save();
  res.status(200).json({ status: 'success', data: { data: departure } });
});

exports.deleteDeparture = catchAsync(async (req, res, next) => {
  const departure = await Departure.findOne({
    _id: req.params.departureId,
    tour: req.params.tourId,
  });
  if (!departure) return next(new AppError('No departure found', 404));
  if (departure.bookedSeats || departure.reservedSeats) {
    return next(
      new AppError('A departure with allocated seats cannot be deleted', 409),
    );
  }
  await departure.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});
