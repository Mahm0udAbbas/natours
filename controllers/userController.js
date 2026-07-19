const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const imageStorage = require('../services/imageStorage');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};
exports.createUser = catchAsync(async (req, res) => {
  const user = await User.create(req.body);
  user.password = undefined;
  res.status(201).json({ status: 'success', data: { data: user } });
});

exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!user) return next(new AppError('No user found with that ID', 404));
  res.status(200).json({ status: 'success', data: { data: user } });
});
exports.getAllUsers = factory.getAll(User);

const favoriteToursQuery = (userId, update) => {
  const query = update
    ? User.findByIdAndUpdate(userId, update, {
        returnDocument: 'after',
        runValidators: true,
      })
    : User.findById(userId);

  return query.select('+favorites').populate({ path: 'favorites' });
};

const sendFavorites = (res, user) => {
  const favorites = user.favorites || [];
  res.status(200).json({
    status: 'success',
    results: favorites.length,
    data: { favorites },
  });
};

exports.getMyFavorites = catchAsync(async (req, res) => {
  const user = await favoriteToursQuery(req.user.id);
  sendFavorites(res, user);
});

exports.addFavorite = catchAsync(async (req, res, next) => {
  const tourExists = await Tour.exists({ _id: req.params.tourId });
  if (!tourExists) return next(new AppError('No tour found with that ID', 404));

  const user = await favoriteToursQuery(req.user.id, {
    $addToSet: { favorites: req.params.tourId },
  });
  sendFavorites(res, user);
});

exports.removeFavorite = catchAsync(async (req, res) => {
  const user = await favoriteToursQuery(req.user.id, {
    $pull: { favorites: req.params.tourId },
  });
  sendFavorites(res, user);
});

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
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

exports.uploadUserPhoto = upload.single('photo');

exports.prepareUserPhotoValidation = (req, res, next) => {
  if (req.file && !req.body.name && !req.body.email)
    req.body.name = req.user.name;
  next();
};

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  if (!imageStorage.isStorageEnabled()) {
    throw new AppError('Image uploads are temporarily unavailable', 503);
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  const image = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 });

  if (imageStorage.isRemoteStorage()) {
    const uploaded = await imageStorage.uploadImage({
      buffer: await image.toBuffer(),
      fileName: req.file.filename,
      folder: '/natours/users',
    });
    req.uploadedUserPhoto = uploaded;
  } else {
    await image.toFile(`public/img/users/${req.file.filename}`);
  }

  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if the user enter the password or passordConfirm
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password update', 400));
  }

  // 2) Fiter the user data that are allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.uploadedUserPhoto) {
    filteredBody.photo = req.uploadedUserPhoto.url;
    filteredBody.photoFileId = req.uploadedUserPhoto.fileId;
    filteredBody.photoPath = req.uploadedUserPhoto.path;
  } else if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update the user Data
  const previous = await User.findById(req.user.id).select('+photoFileId');
  let updatedUser;
  try {
    updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      returnDocument: 'after',
      runValidators: true,
    });
  } catch (error) {
    if (req.uploadedUserPhoto) {
      await imageStorage
        .deleteImage(req.uploadedUserPhoto.fileId)
        .catch(() => {});
    }
    throw error;
  }
  if (req.uploadedUserPhoto && previous.photoFileId) {
    imageStorage.deleteImage(previous.photoFileId).catch(() => {});
  }
  // 4) Send the response
  res.status(200).json({
    status: 'success',
    message: 'User data updated successfully',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    message: 'User deleted successfully',
    data: null,
  });
});
