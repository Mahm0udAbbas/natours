const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../models/tourModel');
const Departure = require('../models/departureModel');
const { databaseUrl, validateEnvironment } = require('../utils/env');

dotenv.config({ path: './.env' });

const run = async () => {
  const env = validateEnvironment();
  await mongoose.connect(databaseUrl(env));
  const tours = await Tour.find({ startDates: { $exists: true, $ne: [] } });
  const operations = tours.flatMap((tour) =>
    tour.startDates.map((startDate) => ({
      updateOne: {
        filter: { tour: tour.id, startDate },
        update: {
          $setOnInsert: {
            capacity: tour.maxGroupSize,
            reservedSeats: 0,
            bookedSeats: 0,
            status: 'scheduled',
          },
        },
        upsert: true,
      },
    })),
  );
  if (operations.length) await Departure.bulkWrite(operations);

  // Backfill legacy paid bookings without trusting their redirect-era inputs.
  const legacyBookings = await mongoose.connection
    .collection('bookings')
    .find({
      departure: { $exists: false },
    })
    .toArray();
  await legacyBookings.reduce(
    (chain, legacy) =>
      chain.then(async () => {
        const tour = await Tour.findById(legacy.tour);
        if (!tour) return;
        const startDate =
          tour.startDates[0] || legacy.createdAt || new Date('2000-01-01');
        const departure = await Departure.findOneAndUpdate(
          { tour: tour.id, startDate },
          {
            $setOnInsert: {
              capacity: Math.max(tour.maxGroupSize, 1),
              reservedSeats: 0,
              status: 'completed',
            },
            $inc: { bookedSeats: legacy.paid === false ? 0 : 1 },
          },
          { upsert: true, returnDocument: 'after' },
        );
        const unitPrice = Number(legacy.price) || tour.price;
        await mongoose.connection.collection('bookings').updateOne(
          { _id: legacy._id, departure: { $exists: false } },
          {
            $set: {
              departure: departure._id,
              seats: 1,
              unitPrice,
              totalPrice: unitPrice,
              status: legacy.paid === false ? 'cancelled' : 'paid',
              paidAt:
                legacy.paid === false ? null : legacy.createdAt || new Date(),
            },
            $unset: { price: '', paid: '' },
          },
        );
      }),
    Promise.resolve(),
  );
  await mongoose.disconnect();
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
