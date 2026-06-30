const dotenv = require('dotenv');
const mongoose = require('mongoose');
mongoose.set('autoIndex', false);
const Tour = require('../models/tourModel');

dotenv.config({ path: './.env' });

const repairGeoIndex = async () => {
  await mongoose.connect(process.env.DATABASE_LOCAL);

  const docs = await Tour.collection
    .find({ startLocation: { $exists: true } })
    .project({ _id: 1, startLocation: 1 })
    .toArray();
  const invalid = docs.filter(({ startLocation }) => {
    const coordinates = startLocation?.coordinates;
    return (
      startLocation?.type !== 'Point' ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every(Number.isFinite)
    );
  });

  if (invalid.length) {
    await Tour.collection.updateMany(
      { _id: { $in: invalid.map(({ _id }) => _id) } },
      { $unset: { startLocation: '' } },
    );
  }

  await Tour.createIndexes();
  const indexes = await Tour.collection.indexes();
  console.log({
    cleanedMalformedLocations: invalid.length,
    geoIndex: indexes.find((index) => index.key.startLocation === '2dsphere'),
  });
  await mongoose.disconnect();
};

repairGeoIndex().catch((err) => {
  console.error(err);
  process.exit(1);
});
