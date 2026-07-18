const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const Departure = require('../../models/departureModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

describe('staff views', () => {
  test('renders role-aware dashboards and management tables', async () => {
    const [tour, admin] = await Promise.all([
      createTour(),
      createUser({ role: 'admin' }),
    ]);
    await Departure.create({
      tour: tour.id,
      startDate: new Date(Date.now() + 86400000),
      capacity: 10,
    });
    const authorization = authHeader(admin);
    const paths = [
      '/staff',
      '/staff/tours',
      '/staff/departures',
      '/staff/bookings',
      '/staff/users',
      '/staff/reviews',
    ];
    const responses = await Promise.all(
      paths.map((path) =>
        request(app).get(path).set('Authorization', authorization),
      ),
    );
    responses.forEach((response) => expect(response.status).toBe(200));
    expect(responses[0].text).toContain('Staff dashboard');
    expect(responses[2].text).toContain('Add departure');
  });

  test('prevents guides from opening management pages', async () => {
    const guide = await createUser({ role: 'guide' });
    const response = await request(app)
      .get('/staff/users')
      .set('Authorization', authHeader(guide));
    expect(response.status).toBe(403);
  });
});
