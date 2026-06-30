const { validate, z } = require('../middleware/validateRequest');
const { toPlainText } = require('../utils/sanitizeText');

const plainText = (schema = z.string().min(1, 'This field cannot be empty')) =>
  z.preprocess(toPlainText, schema);

const requiredPlainText = plainText();
const optionalPlainText = requiredPlainText.optional();

const positiveInt = z.coerce
  .number()
  .int('This field must be an integer')
  .positive('This field must be greater than 0');

const nonNegativeNumber = z.coerce
  .number()
  .min(0, 'This field must be a positive number');

const coordinate = z.coerce.number();

const booleanFromInput = z.preprocess(
  (value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  },
  z.boolean({ error: 'This field must be true or false' }),
);

const startLocationSchema = z
  .object({
    type: z.literal('Point').optional(),
    coordinates: z
      .array(coordinate)
      .length(2, 'Coordinates must contain longitude and latitude'),
    address: optionalPlainText,
    description: optionalPlainText,
  })
  .strict();

const locationSchema = z
  .object({
    type: z.literal('Point').optional(),
    coordinates: z.array(coordinate).optional(),
    address: optionalPlainText,
    description: optionalPlainText,
    day: positiveInt.optional(),
  })
  .strict();

const commonTourSchema = {
  name: plainText(
    z
      .string()
      .min(10, 'Tour name must contain at least 10 characters')
      .max(40, 'Tour name must contain at most 40 characters'),
  ),
  duration: positiveInt,
  maxGroupSize: positiveInt,
  difficulty: z.enum(['easy', 'medium', 'difficult'], {
    error: 'Difficulty is either: easy, medium, difficult',
  }),
  ratingsAverage: z.coerce
    .number()
    .min(1, 'ratingsAverage must be between 1 and 5')
    .max(5, 'ratingsAverage must be between 1 and 5')
    .optional(),
  ratingsQuantity: positiveInt.optional(),
  price: nonNegativeNumber,
  priceDiscount: nonNegativeNumber.optional(),
  summary: requiredPlainText,
  description: requiredPlainText,
  imageCover: optionalPlainText,
  images: z.array(requiredPlainText).optional(),
  startLocation: startLocationSchema.optional(),
  locations: z.array(locationSchema).optional(),
  startDates: z.array(z.coerce.date()).optional(),
  secretTour: booleanFromInput.optional(),
  guides: z
    .array(
      z
        .string()
        .regex(/^[a-fA-F0-9]{24}$/, 'Each guide must be a valid user id'),
    )
    .optional(),
};

const createTourSchema = z.object(commonTourSchema).strict();

const updateTourSchema = z
  .object(
    Object.fromEntries(
      Object.entries(commonTourSchema).map(([key, schema]) => [
        key,
        schema.optional(),
      ]),
    ),
  )
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Please provide at least one tour field to update',
  });

const tourIdParamsSchema = z
  .object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Tour id is invalid'),
  })
  .strict();

exports.validateTourId = validate({ params: tourIdParamsSchema });
exports.validateCreateTour = validate({ body: createTourSchema });
exports.validateUpdateTour = validate({ body: updateTourSchema });
exports.plainText = plainText;
