const request = require('supertest');

const mockCheckoutCreate = jest.fn();
const mockRefundCreate = jest.fn();
const mockConstructEvent = jest.fn();
const mockPaymentRetrieve = jest.fn();
jest.mock('stripe', () =>
  jest.fn(() => ({
    checkout: { sessions: { create: mockCheckoutCreate } },
    refunds: { create: mockRefundCreate },
    webhooks: { constructEvent: mockConstructEvent },
    paymentIntents: { retrieve: mockPaymentRetrieve },
  })),
);
require('../helpers/database');
const app = require('../../app');
const Booking = require('../../models/bookingModel');
const Departure = require('../../models/departureModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

let departureSequence = 0;
const createBooking = async ({ tour, user, status = 'paid' }) => {
  departureSequence += 1;
  const departure = await Departure.create({
    tour: tour.id,
    startDate: new Date(Date.now() + 86400000 + departureSequence * 1000),
    capacity: 20,
    bookedSeats: status === 'paid' ? 1 : 0,
  });
  return Booking.create({
    tour: tour.id,
    departure: departure.id,
    user: user.id,
    seats: 1,
    unitPrice: tour.price,
    totalPrice: tour.price,
    status,
  });
};

describe('booking API', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_example';
    mockCheckoutCreate.mockReset();
    mockRefundCreate.mockReset();
    mockConstructEvent.mockReset();
  });

  test('does not expose arbitrary booking creation', async () => {
    const admin = await createUser({ role: 'admin' });
    const response = await request(app)
      .post('/api/v1/booking')
      .set('Authorization', authHeader(admin))
      .send({ price: 1, paid: true });

    expect(response.status).toBe(404);
    expect(await Booking.countDocuments()).toBe(0);
  });

  test('strictly validates checkout input', async () => {
    const user = await createUser();
    const response = await request(app)
      .post('/api/v1/booking/checkout-session')
      .set('Authorization', authHeader(user))
      .send({ departureId: 'forged', seats: 0, price: 1 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Departure id is invalid');
  });

  test('reserves capacity and prices checkout from the tour', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const departure = await Departure.create({
      tour: tour.id,
      startDate: new Date(Date.now() + 86400000),
      capacity: 3,
    });
    mockCheckoutCreate.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.test',
    });

    const response = await request(app)
      .post('/api/v1/booking/checkout-session')
      .set('Authorization', authHeader(user))
      .send({ departureId: departure.id, seats: 2 });

    expect(response.status).toBe(200);
    const booking = await Booking.findOne({ user: user.id });
    expect(booking.totalPrice).toBe(tour.price * 2);
    expect((await Departure.findById(departure.id)).reservedSeats).toBe(2);
    expect(mockCheckoutCreate.mock.calls[0][0].line_items[0].quantity).toBe(2);
  });

  test('rejects checkout when requested seats exceed capacity', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const departure = await Departure.create({
      tour: tour.id,
      startDate: new Date(Date.now() + 86400000),
      capacity: 1,
    });
    const response = await request(app)
      .post('/api/v1/booking/checkout-session')
      .set('Authorization', authHeader(user))
      .send({ departureId: departure.id, seats: 2 });
    expect(response.status).toBe(409);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  test('returns only the current customers bookings', async () => {
    const [tour, user, other] = await Promise.all([
      createTour(),
      createUser(),
      createUser(),
    ]);
    await Promise.all([
      createBooking({ tour, user }),
      createBooking({ tour, user: other, status: 'pending' }),
    ]);

    const response = await request(app)
      .get('/api/v1/booking/me')
      .set('Authorization', authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.results).toBe(1);
    expect(response.body.data.data[0].status).toBe('paid');
  });

  test('requires a Stripe signature for webhooks', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await request(app)
      .post('/api/v1/booking/webhook')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(response.status).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
  });

  test('releases reservations on a signed checkout-expired event', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const booking = await createBooking({ tour, user, status: 'pending' });
    await Departure.updateOne({ _id: booking.departure }, { reservedSeats: 1 });
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.expired',
      data: { object: { metadata: { bookingId: booking.id } } },
    });
    const response = await request(app)
      .post('/api/v1/booking/webhook')
      .set('stripe-signature', 'valid')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(response.status).toBe(200);
    expect((await Booking.findById(booking.id)).status).toBe('cancelled');
    expect((await Departure.findById(booking.departure)).reservedSeats).toBe(0);
  });

  test('allows an admin to refund a paid booking', async () => {
    const [tour, user, admin] = await Promise.all([
      createTour(),
      createUser(),
      createUser({ role: 'admin' }),
    ]);
    const booking = await createBooking({ tour, user });
    booking.stripePaymentIntentId = 'pi_test';
    await booking.save();
    mockRefundCreate.mockResolvedValue({ id: 're_test' });
    const response = await request(app)
      .post(`/api/v1/booking/${booking.id}/refund`)
      .set('Authorization', authHeader(admin));
    expect(response.status).toBe(200);
    expect(response.body.data.data.status).toBe('refunded');
    expect(mockRefundCreate).toHaveBeenCalledTimes(1);
  });

  test('validates booking identifiers on staff reads', async () => {
    const admin = await createUser({ role: 'admin' });
    const response = await request(app)
      .get('/api/v1/booking/not-a-booking-id')
      .set('Authorization', authHeader(admin));

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Booking id is invalid');
  });
});
