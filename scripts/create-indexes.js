const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { databaseUrl, validateEnvironment } = require('../utils/env');

dotenv.config({ path: './.env' });

const run = async () => {
  const env = validateEnvironment();
  await mongoose.connect(databaseUrl(env));
  require('../models/userModel');
  require('../models/tourModel');
  require('../models/reviewModel');
  require('../models/departureModel');
  require('../models/bookingModel');
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.createIndexes()),
  );
  await mongoose.disconnect();
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
