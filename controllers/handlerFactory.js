const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id, {
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
      message: 'document deleted successfully',
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
      message: `Document updated successfully!`,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const requestQuery = { ...req.query, ...req.aliasQuery };

    const features = new APIFeatures(Model.find(filter), requestQuery)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docsNum = await Model.countDocuments(features.filterQuery);
    if (requestQuery.page) {
      if (features.skip >= docsNum)
        throw new AppError('This page does not exist', 404);
    }

    // const docs = await features.query.explain();
    const docs = await features.query;

    // const indexes = await Model.collection.indexes();
    // console.log(indexes);

    res.status(200).json({
      status: 'success',
      results: docs.length,
      pagination: {
        page: features.page,
        limit: features.limit,
        totalResults: docsNum,
        totalPages: Math.ceil(docsNum / features.limit),
      },
      data: {
        data: docs,
      },
    });
  });
