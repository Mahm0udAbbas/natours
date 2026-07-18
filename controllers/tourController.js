const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const imageStorage = require('../services/imageStorage');

// Controllers

exports.aliasTopTours = (req, res, next) => {
  req.aliasQuery = {
    limit: '5',
    sort: '-ratingsAverage,price',
    fields: 'name,price,ratingsAverage,difficulty,summary',
  };

  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.prepareTourImageValidation = (req, res, next) => {
  if (req.files?.imageCover) req.body.imageCover = 'pending-upload';
  if (req.files?.images) req.body.images = ['pending-upload'];
  next();
};

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  try {
    if (req.files.imageCover) {
      req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

      const image = sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 });
      if (imageStorage.isRemoteStorage()) {
        const uploaded = await imageStorage.uploadImage({
          buffer: await image.toBuffer(),
          fileName: req.body.imageCover,
          folder: '/natours/tours',
        });
        req.body.imageCover = uploaded.url;
        req.trustedImageFields = {
          imageCoverFileId: uploaded.fileId,
          imageCoverPath: uploaded.path,
        };
        req.remoteUploads = [uploaded];
      } else await image.toFile(`public/img/tours/${req.body.imageCover}`);
    }

    if (req.files.images) {
      req.body.images = [];
      const imageFileIds = [];
      const imagePaths = [];

      await Promise.all(
        req.files.images.map(async (file, index) => {
          const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

          const image = sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 });
          if (imageStorage.isRemoteStorage()) {
            const uploaded = await imageStorage.uploadImage({
              buffer: await image.toBuffer(),
              fileName: filename,
              folder: '/natours/tours',
            });
            req.remoteUploads = [...(req.remoteUploads || []), uploaded];
            req.body.images.push(uploaded.url);
            imageFileIds.push(uploaded.fileId);
            imagePaths.push(uploaded.path);
          } else {
            await image.toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
          }
        }),
      );
      if (imageFileIds.length) {
        req.trustedImageFields = {
          ...(req.trustedImageFields || {}),
          imageFileIds,
          imagePaths,
        };
      }
    }
  } catch (error) {
    await Promise.all(
      (req.remoteUploads || []).map((item) =>
        imageStorage.deleteImage(item.fileId).catch(() => {}),
      ),
    );
    throw error;
  }

  next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).select(
    '+imageCoverFileId +imageFileIds',
  );
  if (!tour) return next(new AppError('No tour found with that ID', 404));
  const previousCoverId = tour.imageCoverFileId;
  const previousImageIds = [...(tour.imageFileIds || [])];
  Object.assign(tour, req.body, req.trustedImageFields);
  try {
    await tour.save();
  } catch (error) {
    await Promise.all(
      (req.remoteUploads || []).map((item) =>
        imageStorage.deleteImage(item.fileId).catch(() => {}),
      ),
    );
    throw error;
  }
  const replacedIds = [];
  if (req.trustedImageFields?.imageCoverFileId && previousCoverId) {
    replacedIds.push(previousCoverId);
  }
  if (req.trustedImageFields?.imageFileIds) {
    replacedIds.push(...previousImageIds);
  }
  replacedIds.forEach((fileId) =>
    imageStorage.deleteImage(fileId).catch(() => {}),
  );
  tour.imageCoverFileId = undefined;
  tour.imageCoverPath = undefined;
  tour.imageFileIds = undefined;
  tour.imagePaths = undefined;
  res.status(200).json({ status: 'success', data: { data: tour } });
});
exports.deleteTour = factory.deleteOne(Tour);

exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%B',
            date: '$startDates',
          },
        },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        numTourStarts: 1,
        tours: 1,
      },
    },
    { $sort: { numTourStarts: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, unit, latlng } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide the lat and the lng in this format lat,lng',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng * 1, lat * 1], radius] },
    },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { unit, latlng } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide the lat and the lng in this format lat,lng',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
