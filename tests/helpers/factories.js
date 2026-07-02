const jwt = require('jsonwebtoken');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');

let sequence = 0;

const buildTour = (overrides = {}) => {
  sequence += 1;
  return {
    name: `Test Tour Number ${sequence}`,
    duration: 7,
    maxGroupSize: 10,
    difficulty: 'easy',
    ratingsAverage: 4.5,
    price: 500,
    summary: 'A valid summary for an automated test tour',
    description: 'A detailed description for an automated test tour',
    startLocation: {
      type: 'Point',
      coordinates: [-80.1859, 25.7743],
      address: 'Miami, USA',
    },
    startDates: [new Date('2030-01-01')],
    ...overrides,
  };
};

const createTour = (overrides) => Tour.create(buildTour(overrides));

const createUser = async (overrides = {}) => {
  sequence += 1;
  return User.create({
    name: 'Test User',
    email: `user${sequence}@example.com`,
    password: 'password123',
    passwordConfirm: 'password123',
    ...overrides,
  });
};

const authHeader = (user) =>
  `Bearer ${jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })}`;

module.exports = { authHeader, buildTour, createTour, createUser };
