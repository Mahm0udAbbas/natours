const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const Tour = require('../../models/tourModel');
const {
  authHeader,
  buildTour,
  createTour,
  createUser,
} = require('../helpers/factories');

describe('tour API', () => {
  test('lists and filters tours', async () => {
    await createTour({ difficulty: 'easy', price: 200 });
    await createTour({ difficulty: 'difficult', price: 900 });

    const response = await request(app).get(
      '/api/v1/tours?difficulty=easy&sort=price',
    );

    expect(response.status).toBe(200);
    expect(response.body.results).toBe(1);
    expect(response.body.data.data[0].difficulty).toBe('easy');
  });

  test('rejects invalid tour ids', async () => {
    const response = await request(app).get('/api/v1/tours/not-an-id');
    expect(response.status).toBe(400);
  });

  test('prevents anonymous tour creation', async () => {
    const response = await request(app).post('/api/v1/tours').send(buildTour());
    expect(response.status).toBe(401);
  });

  test('prevents regular users from creating tours', async () => {
    const user = await createUser();
    const response = await request(app)
      .post('/api/v1/tours')
      .set('Authorization', authHeader(user))
      .send(buildTour());
    expect(response.status).toBe(403);
  });

  test('allows an admin to create a valid tour', async () => {
    const admin = await createUser({ role: 'admin' });
    const response = await request(app)
      .post('/api/v1/tours')
      .set('Authorization', authHeader(admin))
      .send(buildTour());

    expect(response.status).toBe(201);
    expect(await Tour.countDocuments()).toBe(1);
  });

  test('updates a tour from multipart form data', async () => {
    const admin = await createUser({ role: 'admin' });
    const tour = await createTour();

    const response = await request(app)
      .patch(`/api/v1/tours/${tour.id}`)
      .set('Authorization', authHeader(admin))
      .field('price', '499');

    expect(response.status).toBe(200);
    expect(response.body.data.data.price).toBe(499);
  });

  test('rejects malformed GeoJSON coordinates', async () => {
    const admin = await createUser({ role: 'admin' });
    const response = await request(app)
      .post('/api/v1/tours')
      .set('Authorization', authHeader(admin))
      .send(buildTour({ startLocation: { coordinates: [] } }));

    expect(response.status).toBe(400);
    expect(await Tour.countDocuments()).toBe(0);
  });

  test('returns distances using the geospatial index', async () => {
    await createTour();
    const response = await request(app).get(
      '/api/v1/tours/distances/center/25.7743,-80.1859/unit/mi',
    );

    expect(response.status).toBe(200);
    expect(response.body.results).toBe(1);
    expect(response.body.data.data[0].distance).toBe(0);
  });
});
