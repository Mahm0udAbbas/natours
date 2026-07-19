const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const slugify = require('slugify');

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const Departure = require('../models/departureModel');
const Booking = require('../models/bookingModel');

dotenv.config({ path: './.env', quiet: true });

const args = new Set(process.argv.slice(2));
const targetArgument = [...args].find((arg) => arg.startsWith('--target='));
const productionConfirmation = [...args].find((arg) =>
  arg.startsWith('--confirm-production='),
);
const target = targetArgument ? targetArgument.split('=')[1] : 'local';
const requestedActions = ['import', 'delete', 'dry-run'].filter((name) =>
  args.has(`--${name}`),
);
const action = requestedActions.length === 1 ? requestedActions[0] : null;

const readData = (name) =>
  JSON.parse(fs.readFileSync(`${__dirname}/data/${name}.json`, 'utf-8'));

const tours = readData('tours');
const users = readData('users');
const reviews = readData('reviews');

const writeLine = (message) => process.stdout.write(`${message}\n`);

const configuredDatabase = () => {
  if (!['local', 'production'].includes(target)) {
    throw new Error('Target must be local or production');
  }
  const template =
    target === 'production'
      ? process.env.DATABASE
      : process.env.DATABASE_LOCAL || process.env.DATABASE;
  if (!template) throw new Error(`No database URI configured for ${target}`);
  const uri = template.replace(
    '<DATABASE_PASSWORD>',
    encodeURIComponent(process.env.DATABASE_PASSWORD || ''),
  );
  const address = uri.replace(/^mongodb(?:\+srv)?:\/\//, '');
  const hostAndPath = address.slice(address.lastIndexOf('@') + 1).split('?')[0];
  const slash = hostAndPath.indexOf('/');
  const name = slash === -1 ? '' : hostAndPath.slice(slash + 1);
  if (target === 'production' && !name) {
    throw new Error(
      'The production DATABASE URI must include an explicit database name',
    );
  }
  return { uri, name: name || 'test' };
};

const requireConfirmation = (databaseName) => {
  if (
    target === 'production' &&
    action !== 'dry-run' &&
    productionConfirmation !== `--confirm-production=${databaseName}`
  ) {
    throw new Error(
      `Production writes require --confirm-production=${databaseName}`,
    );
  }
  if (action === 'delete' && !args.has('--confirm-delete')) {
    throw new Error('Deletes require the --confirm-delete flag');
  }
};

const departureOperations = () =>
  tours.flatMap((tour) =>
    tour.startDates.map((startDate) => ({
      updateOne: {
        filter: { tour: tour._id, startDate: new Date(startDate) },
        update: {
          $setOnInsert: {
            tour: tour._id,
            startDate: new Date(startDate),
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

const printPlan = () => {
  writeLine(`Target: ${target}`);
  writeLine(`Tours to upsert: ${tours.length}`);
  writeLine(`Users to insert if missing: ${users.length}`);
  writeLine(`Reviews to insert if missing: ${reviews.length}`);
  writeLine(`Departures to insert if missing: ${departureOperations().length}`);
};

const importData = async () => {
  const tourResult = await Tour.bulkWrite(
    tours.map((tour) => {
      const { _id, ...tourData } = tour;
      tourData.slug = slugify(tour.name, { lower: true });
      return {
        updateOne: {
          filter: { _id },
          update: { $set: tourData },
          upsert: true,
        },
      };
    }),
  );
  const userResult = await User.bulkWrite(
    users.map((user) => {
      const { _id, favorites = [], ...userOnInsert } = user;
      const update = { $setOnInsert: userOnInsert };
      if (favorites.length)
        update.$addToSet = { favorites: { $each: favorites } };
      return {
        updateOne: { filter: { _id }, update, upsert: true },
      };
    }),
  );
  const reviewResult = await Review.bulkWrite(
    reviews.map((review) => {
      const { _id, ...reviewOnInsert } = review;
      return {
        updateOne: {
          filter: { _id },
          update: { $setOnInsert: reviewOnInsert },
          upsert: true,
        },
      };
    }),
  );
  const departureResult = await Departure.bulkWrite(departureOperations());
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.createIndexes()),
  );

  writeLine(
    `Imported: tours=${tourResult.upsertedCount}, users=${userResult.upsertedCount}, reviews=${reviewResult.upsertedCount}, departures=${departureResult.upsertedCount}`,
  );
};

const deleteData = async () => {
  const results = await Promise.all([
    Booking.deleteMany(),
    Departure.deleteMany(),
    Review.deleteMany(),
    Tour.deleteMany(),
    User.deleteMany(),
  ]);
  writeLine(
    `Deleted: bookings=${results[0].deletedCount}, departures=${results[1].deletedCount}, reviews=${results[2].deletedCount}, tours=${results[3].deletedCount}, users=${results[4].deletedCount}`,
  );
};

const run = async () => {
  if (!action) {
    throw new Error(
      'Use --dry-run, --import, or --delete with --target=local|production',
    );
  }
  const database = configuredDatabase();
  requireConfirmation(database.name);
  printPlan();
  if (action === 'dry-run') return;

  await mongoose.connect(database.uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  writeLine(`Connected to database: ${mongoose.connection.name}`);
  if (action === 'import') await importData();
  else await deleteData();
};

if (require.main === module) {
  run()
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = { importData };
