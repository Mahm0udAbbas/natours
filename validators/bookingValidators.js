const { validate, z } = require('../middleware/validateRequest');

const objectId = (fieldName) =>
  z.string().regex(/^[a-fA-F0-9]{24}$/, `${fieldName} is invalid`);

const nonNegativeNumber = z.coerce
  .number()
  .min(0, 'Price must be a positive number');

const booleanFromInput = z.preprocess(
  (value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  },
  z.boolean({ error: 'Paid must be true or false' }),
);

const createBookingSchema = z
  .object({
    tour: objectId('Tour id'),
    user: objectId('User id'),
    price: nonNegativeNumber,
    paid: booleanFromInput.optional(),
  })
  .strict();

const updateBookingSchema = z
  .object({
    tour: objectId('Tour id').optional(),
    user: objectId('User id').optional(),
    price: nonNegativeNumber.optional(),
    paid: booleanFromInput.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Please provide at least one booking field to update',
  });

const bookingIdParamsSchema = z
  .object({
    id: objectId('Booking id'),
  })
  .strict();

const checkoutParamsSchema = z
  .object({
    tourId: objectId('Tour id'),
  })
  .strict();

exports.validateCheckoutTourId = validate({ params: checkoutParamsSchema });
exports.validateBookingId = validate({ params: bookingIdParamsSchema });
exports.validateCreateBooking = validate({ body: createBookingSchema });
exports.validateUpdateBooking = validate({ body: updateBookingSchema });
