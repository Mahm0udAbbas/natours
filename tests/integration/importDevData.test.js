require('../helpers/database');
const Departure = require('../../models/departureModel');
const Review = require('../../models/reviewModel');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const { importData } = require('../../dev-data/import-dev-data');

describe('development data importer', () => {
  test('imports complete data and remains idempotent', async () => {
    await importData();
    await importData();

    const [tours, users, reviews, departures, userWithFavorites] =
      await Promise.all([
        Tour.countDocuments(),
        User.countDocuments(),
        Review.countDocuments(),
        Departure.countDocuments(),
        User.findById('5c8a1d5b0190b214360dc057').select('+favorites'),
      ]);

    expect({ tours, users, reviews, departures }).toEqual({
      tours: 9,
      users: 20,
      reviews: 60,
      departures: 27,
    });
    expect(userWithFavorites.favorites).toHaveLength(3);
    expect(await Tour.countDocuments({ slug: { $exists: true } })).toBe(9);
    expect(
      await Departure.countDocuments({ startDate: { $gt: new Date() } }),
    ).toBe(27);
  });
});
