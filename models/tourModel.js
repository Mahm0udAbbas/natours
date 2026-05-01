const mongoose = require('mongoose');

// --- Tour Schema ---
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
  },
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
});

// Explicitly create unique index
// tourSchema.index({ name: 1 }, { unique: true });

// Ensure indexes exist
const Tour = mongoose.model('Tour', tourSchema);

// Create model
Tour.init()
  .then(() => console.log('Indexes are ready!'))
  .catch((err) => console.error('Index creation failed:', err.message));

module.exports = Tour;
