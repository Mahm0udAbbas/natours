const mongoose = require('mongoose');
const Stripe = require('stripe');
const Booking = require('../models/bookingModel');
const Departure = require('../models/departureModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError('Stripe is not configured on this server', 503);
  }
  return Stripe(process.env.STRIPE_SECRET_KEY);
};

const releaseReservation = async (bookingId) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: 'pending' },
    { status: 'cancelled' },
    { returnDocument: 'before' },
  );
  if (booking) {
    await Departure.updateOne(
      { _id: booking.departure },
      { $inc: { reservedSeats: -booking.seats } },
    );
  }
};

const fulfillCheckout = async (checkoutSession) => {
  const bookingId = checkoutSession.metadata?.bookingId;
  if (!bookingId) return;

  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        {
          status: 'paid',
          paidAt: new Date(),
          stripeSessionId: checkoutSession.id,
          stripePaymentIntentId: checkoutSession.payment_intent,
          $unset: { reservationExpiresAt: 1 },
        },
        { returnDocument: 'before', session: dbSession },
      );
      if (!booking) return;

      const result = await Departure.updateOne(
        { _id: booking.departure, reservedSeats: { $gte: booking.seats } },
        {
          $inc: {
            reservedSeats: -booking.seats,
            bookedSeats: booking.seats,
          },
        },
        { session: dbSession },
      );
      if (!result.modifiedCount)
        throw new Error('Reserved capacity is inconsistent');
    });
  } finally {
    await dbSession.endSession();
  }
};

exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { departureId, seats } = req.body;
  const departure = await Departure.findOneAndUpdate(
    {
      _id: departureId,
      status: 'scheduled',
      startDate: { $gt: new Date() },
      $expr: {
        $lte: [
          { $add: ['$reservedSeats', '$bookedSeats', seats] },
          '$capacity',
        ],
      },
    },
    { $inc: { reservedSeats: seats } },
    { returnDocument: 'after' },
  ).populate('tour');

  if (!departure) {
    return next(
      new AppError('Departure is unavailable or lacks capacity', 409),
    );
  }

  const { tour } = departure;
  const { price, priceDiscount } = tour;
  const unitPrice = priceDiscount || price;
  const expiresAt = new Date(Date.now() + 31 * 60 * 1000);
  let booking;
  try {
    booking = await Booking.create({
      tour: tour.id,
      departure: departure.id,
      user: req.user.id,
      seats,
      unitPrice,
      totalPrice: unitPrice * seats,
      reservationExpiresAt: expiresAt,
    });
  } catch (error) {
    await Departure.updateOne(
      { _id: departure.id },
      { $inc: { reservedSeats: -seats } },
    );
    throw error;
  }

  try {
    const stripe = getStripeClient();
    const appUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/tour/${tour.slug}?checkout=cancelled`,
      customer_email: req.user.email,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      metadata: {
        bookingId: booking.id,
        departureId: departure.id,
        userId: req.user.id,
        seats: String(seats),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(unitPrice * 100),
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
            },
          },
          quantity: seats,
        },
      ],
    });
    booking.stripeSessionId = session.id;
    await booking.save();
    res.status(200).json({
      status: 'success',
      data: { sessionId: session.id, url: session.url },
      session,
    });
  } catch (error) {
    await releaseReservation(booking.id);
    throw error;
  }
});

exports.webhook = async (req, res, next) => {
  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError('Webhook signature verification failed', 400);
    }
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === 'checkout.session.completed') {
      await fulfillCheckout(event.data.object);
      if (event.data.object.payment_intent) {
        const intent = await stripe.paymentIntents.retrieve(
          event.data.object.payment_intent,
          { expand: ['latest_charge'] },
        );
        await Booking.updateOne(
          { stripeSessionId: event.data.object.id },
          { receiptUrl: intent.latest_charge?.receipt_url },
        );
      }
    } else if (event.type === 'checkout.session.expired') {
      await releaseReservation(event.data.object.metadata?.bookingId);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    next(
      error.statusCode
        ? error
        : new AppError(`Webhook error: ${error.message}`, 400),
    );
  }
};

exports.getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id }).sort('-createdAt');
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { data: bookings },
  });
});

exports.refundBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({ _id: req.params.id, status: 'paid' });
  if (!booking) return next(new AppError('No refundable booking found', 404));
  const stripe = getStripeClient();
  await stripe.refunds.create(
    { payment_intent: booking.stripePaymentIntentId },
    { idempotencyKey: `booking-refund-${booking.id}` },
  );
  booking.status = 'refunded';
  booking.refundedAt = new Date();
  await booking.save();
  await Departure.updateOne(
    { _id: booking.departure, bookedSeats: { $gte: booking.seats } },
    { $inc: { bookedSeats: -booking.seats } },
  );
  res.status(200).json({ status: 'success', data: { data: booking } });
});

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.releaseReservation = releaseReservation;
exports.fulfillCheckout = fulfillCheckout;
