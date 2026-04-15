const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../models/tourModel');

dotenv.config({ path: './.env' });

// Use local DB or remote DB from .env
const DB_LOCAL = process.env.DATABASE_LOCAL;
// const DB_REMOTE = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD,
// );

// Connect to MongoDB
mongoose
  .connect(DB_LOCAL) // you can replace with DB_REMOTE if you want
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.error('DB connection failed:', err.message));

//READ TOURS FORM JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours-simple.json`, {
    encoding: 'utf-8',
  }),
);

// CREAT TOURS
const importData = async () => {
  try {
    await Tour.create(tours);
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};

// DELETE TOURS

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};

console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
  console.log('Tours Imported successfully !');
} else if (process.argv[2] === '--delete') {
  deleteData();
  console.log('Tours Deleted successfully !');
}
