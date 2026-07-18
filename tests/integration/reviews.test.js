const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const Review = require('../../models/reviewModel');
const Tour = require('../../models/tourModel');
const Booking = require('../../models/bookingModel');
const Departure = require('../../models/departureModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

describe('review API', () => {
  const makeEligible = async (tour, user) => {
    const departure = await Departure.create({
      tour: tour.id,
      startDate: new Date(Date.now() + 86400000),
      capacity: 20,
      bookedSeats: 1,
    });
    await Booking.create({
      tour: tour.id,
      departure: departure.id,
      user: user.id,
      seats: 1,
      unitPrice: tour.price,
      totalPrice: tour.price,
      status: 'paid',
    });
  };

  test('creates a review and updates tour rating statistics', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    await makeEligible(tour, user);
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
    await makeEligible(tour, user);
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

  test('rejects reviews without a verified paid booking', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const response = await request(app)
      .post(`/api/v1/tours/${tour.id}/reviews`)
      .set('Authorization', authHeader(user))
      .send({ review: 'Not eligible', rating: 4 });

    expect(response.status).toBe(403);
  });

  test('lets owners edit, list and delete reviews but blocks other users', async () => {
    const [tour, owner, other] = await Promise.all([
      createTour(),
      createUser(),
      createUser(),
    ]);
    await makeEligible(tour, owner);
    const review = await Review.create({
      tour: tour.id,
      user: owner.id,
      review: 'Original review',
      rating: 4,
    });
    const blocked = await request(app)
      .patch(`/api/v1/reviews/${review.id}`)
      .set('Authorization', authHeader(other))
      .send({ rating: 1 });
    expect(blocked.status).toBe(404);

    const updated = await request(app)
      .patch(`/api/v1/reviews/${review.id}`)
      .set('Authorization', authHeader(owner))
      .send({ review: 'Updated review', rating: 5 });
    expect(updated.status).toBe(200);
    const mine = await request(app)
      .get('/api/v1/reviews/me')
      .set('Authorization', authHeader(owner));
    expect(mine.body.results).toBe(1);

    const removed = await request(app)
      .delete(`/api/v1/reviews/${review.id}`)
      .set('Authorization', authHeader(owner));
    expect(removed.status).toBe(204);
    expect(await Review.countDocuments()).toBe(0);
  });
});
