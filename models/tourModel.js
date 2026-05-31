const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// --- Tour Schema ---
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty '],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // e.g., 4.6666 -> 46.666 -> 47 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // `this` only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
    },
    images: [String],
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        defrault: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Explicitly create unique index
// tourSchema.index({ name: 1 }, { unique: true });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create() but not on .insertMany() or .update()]

tourSchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true });
});

// tourSchema.post('save', function (doc) {
//   console.log(doc);
// });

// QUERY MIDDLEWARE

tourSchema.pre(/^find/, function () {
  this.find({ secretTour: { $ne: true } });
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
});
// Ensure indexes exist
const Tour = mongoose.model('Tour', tourSchema);

// Create model
Tour.init()
  .then(() => console.log('Indexes are ready!'))
  .catch((err) => console.error('Index creation failed:', err.message));

module.exports = Tour;
