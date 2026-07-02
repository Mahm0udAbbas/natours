const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const Review = require('../../models/reviewModel');
const Tour = require('../../models/tourModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

describe('review API', () => {
  test('creates a review and updates tour rating statistics', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const response = await request(app)
      .post(`/api/v1/tours/${tour.id}/reviews`)
      .set('Authorization', authHeader(user))
      .send({ review: 'A useful review', rating: 5 });

    expect(response.status).toBe(201);
    expect(await Review.countDocuments()).toBe(1);
    const updatedTour = await Tour.findById(tour.id);
    expect(updatedTour.ratingsQuantity).toBe(1);
    expect(updatedTour.ratingsAverage).toBe(5);
  });

  test('requires authentication to create a review', async () => {
    const tour = await createTour();
    const response = await request(app)
      .post(`/api/v1/tours/${tour.id}/reviews`)
      .send({ review: 'A useful review', rating: 4 });

    expect(response.status).toBe(401);
  });

  test('prevents duplicate reviews for the same tour and user', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const endpoint = `/api/v1/tours/${tour.id}/reviews`;
    const authorization = authHeader(user);

    await request(app)
      .post(endpoint)
      .set('Authorization', authorization)
      .send({ review: 'First review', rating: 4 });
    const response = await request(app)
      .post(endpoint)
      .set('Authorization', authorization)
      .send({ review: 'Second review', rating: 3 });

    expect(response.status).toBe(400);
    expect(await Review.countDocuments()).toBe(1);
  });

  test('rejects ratings outside the accepted range', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const response = await request(app)
      .post(`/api/v1/tours/${tour.id}/reviews`)
      .set('Authorization', authHeader(user))
      .send({ review: 'Invalid rating', rating: 6 });

    expect(response.status).toBe(400);
  });
});
