const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const mongoose = require('mongoose');
mongoose.set('autoIndex', false);

process.on('uncaughtException', (err) => {
  console.log(err, err.name);
  console.log('UNHANDLED REJECTION , Shutting down');

  process.exit(1);
});
const app = require('./app');
const Tour = require('./models/tourModel');

// Use local DB or remote DB from .env
const DB_LOCAL = process.env.DATABASE_LOCAL;
// const DB_REMOTE = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD,
// );

const port = process.env.PORT || 3000;
let server;

// Connect and create all schema indexes before accepting requests. $geoNear
// cannot run until the startLocation 2dsphere index exists.
const start = async () => {
  await mongoose.connect(DB_LOCAL); // you can replace with DB_REMOTE if needed
  console.log('DB connection successful!');

  await Tour.createIndexes();
  console.log('Indexes are ready!');

  server = app.listen(port, () => {
    console.log(`Server listening on port ${port}...`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.log(err, err.name);
  console.log('UNHANDLED REJECTION , Shutting down');

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
