const { validate, z } = require('../middleware/validateRequest');
const { plainText } = require('./tourValidators');

const createReviewSchema = z
  .object({
    review: plainText(z.string().min(1, 'Review cannot be empty')),
    rating: z
      .number()
      .min(1, 'Rating must be above 1.0')
      .max(5, 'Rating must be below 5.0'),
    createAt: z.coerce.date().default(new Date()),
    tour: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, 'Invalid tour ID')
      .optional(),
    // user: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid user ID'),
  })
  .strict();

const updateReviewSchema = z
  .object({
    review: plainText(z.string().min(1, 'Review cannot be empty').optional()),
    rating: z
      .number()
      .min(1, 'Rating must be above 1.0')
      .max(5, 'Rating must be below 5.0')
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Please provide review or rating to update',
  });

const tourIdParamsSchema = z
  .object({
    tourId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, 'Tour id is invalid')
      .optional(),
  })
  .strict();

const reviewIdParamsSchema = tourIdParamsSchema
  .extend({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Review id is invalid'),
  })
  .strict();

exports.validateCreateReview = validate({ body: createReviewSchema });
exports.validateUpdateReview = validate({ body: updateReviewSchema });
exports.validateReviewTourId = validate({ params: tourIdParamsSchema });
exports.validateReviewId = validate({ params: reviewIdParamsSchema });
