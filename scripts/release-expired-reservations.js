const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const { releaseReservation } = require('../controllers/bookingController');
const { databaseUrl, validateEnvironment } = require('../utils/env');

dotenv.config({ path: './.env' });

const run = async () => {
  const env = validateEnvironment();
  await mongoose.connect(databaseUrl(env));
  const expired = await Booking.find({
    status: 'pending',
    reservationExpiresAt: { $lte: new Date() },
  }).select('_id');
  await Promise.all(expired.map((booking) => releaseReservation(booking.id)));
  await mongoose.disconnect();
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
