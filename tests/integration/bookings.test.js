const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const Booking = require('../../models/bookingModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

describe('booking API', () => {
  test('allows admins to create a booking', async () => {
    const [tour, user, admin] = await Promise.all([
      createTour(),
      createUser(),
      createUser({ role: 'admin' }),
    ]);

    const response = await request(app)
      .post('/api/v1/booking')
      .set('Authorization', authHeader(admin))
      .send({
        tour: tour.id,
        user: user.id,
        price: 500,
        paid: true,
      });

    expect(response.status).toBe(201);
    expect(await Booking.countDocuments()).toBe(1);
    expect(response.body.data.data.price).toBe(500);
  });

  test('rejects booking creation from regular users', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);

    const response = await request(app)
      .post('/api/v1/booking')
      .set('Authorization', authHeader(user))
      .send({
        tour: tour.id,
        user: user.id,
        price: 500,
      });

    expect(response.status).toBe(403);
    expect(await Booking.countDocuments()).toBe(0);
  });

  test('validates booking create payload', async () => {
    const admin = await createUser({ role: 'admin' });

    const response = await request(app)
      .post('/api/v1/booking')
      .set('Authorization', authHeader(admin))
      .send({
        tour: 'not-a-tour-id',
        user: 'not-a-user-id',
        price: -10,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Tour id is invalid');
  });

  test('allows admins to update controlled booking fields', async () => {
    const [tour, user, admin] = await Promise.all([
      createTour(),
      createUser(),
      createUser({ role: 'admin' }),
    ]);
    const booking = await Booking.create({
      tour: tour.id,
      user: user.id,
      price: 500,
    });

    const response = await request(app)
      .patch(`/api/v1/booking/${booking.id}`)
      .set('Authorization', authHeader(admin))
      .send({ paid: false, price: 450 });

    expect(response.status).toBe(200);
    expect(response.body.data.data.paid).toBe(false);
    expect(response.body.data.data.price).toBe(450);
  });

  test('validates booking id params and update body', async () => {
    const admin = await createUser({ role: 'admin' });

    const response = await request(app)
      .patch('/api/v1/booking/not-a-booking-id')
      .set('Authorization', authHeader(admin))
      .send({ paid: false });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Booking id is invalid');
  });
});
