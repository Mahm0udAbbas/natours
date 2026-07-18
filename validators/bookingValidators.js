const { validate, z } = require('../middleware/validateRequest');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Booking id is invalid');
const checkoutSchema = z
  .object({
    departureId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, 'Departure id is invalid'),
    seats: z.coerce.number().int().min(1).max(10),
  })
  .strict();
const bookingIdSchema = z.object({ id: objectId }).strict();

exports.validateCheckout = validate({ body: checkoutSchema });
exports.validateBookingId = validate({ params: bookingIdSchema });
