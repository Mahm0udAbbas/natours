const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const Departure = require('../../models/departureModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

describe('departure API', () => {
  test('supports public listing and staff lifecycle controls', async () => {
    const [tour, admin] = await Promise.all([
      createTour(),
      createUser({ role: 'admin' }),
    ]);
    const startDate = new Date(Date.now() + 86400000).toISOString();
    const created = await request(app)
      .post(`/api/v1/tours/${tour.id}/departures`)
      .set('Authorization', authHeader(admin))
      .send({ startDate, capacity: 12 });
    expect(created.status).toBe(201);

    const departureId = created.body.data.data.id;
    const listed = await request(app).get(
      `/api/v1/tours/${tour.id}/departures`,
    );
    expect(listed.body.results).toBe(1);

    const updated = await request(app)
      .patch(`/api/v1/tours/${tour.id}/departures/${departureId}`)
      .set('Authorization', authHeader(admin))
      .send({ capacity: 15 });
    expect(updated.body.data.data.capacity).toBe(15);

    const removed = await request(app)
      .delete(`/api/v1/tours/${tour.id}/departures/${departureId}`)
      .set('Authorization', authHeader(admin));
    expect(removed.status).toBe(204);
    expect(await Departure.countDocuments()).toBe(0);
  });

  test('prevents reducing capacity below allocated seats', async () => {
    const [tour, lead] = await Promise.all([
      createTour(),
      createUser({ role: 'lead-guide' }),
    ]);
    const departure = await Departure.create({
      tour: tour.id,
      startDate: new Date(Date.now() + 86400000),
      capacity: 5,
      bookedSeats: 3,
    });
    const response = await request(app)
      .patch(`/api/v1/tours/${tour.id}/departures/${departure.id}`)
      .set('Authorization', authHeader(lead))
      .send({ capacity: 2 });
    expect(response.status).toBe(400);
  });
});
