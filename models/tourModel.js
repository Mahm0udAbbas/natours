const mongoose = require('mongoose');
const slugify = require('slugify');

// --- Tour Schema ---
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
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
      requried: [true, 'A tour must have a difficulty '],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
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
    },
    summary: {
      type: String,
      trim: true,
      requried: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
      requried: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
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

// Ensure indexes exist
const Tour = mongoose.model('Tour', tourSchema);

// Create model
Tour.init()
  .then(() => console.log('Indexes are ready!'))
  .catch((err) => console.error('Index creation failed:', err.message));

module.exports = Tour;
