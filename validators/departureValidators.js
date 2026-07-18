const { validate, z } = require('../middleware/validateRequest');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
const fields = {
  startDate: z.coerce.date(),
  capacity: z.coerce.number().int().min(1).max(1000),
  status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
};

const createSchema = z.object(fields).strict();
const updateSchema = z
  .object({
    startDate: fields.startDate.optional(),
    capacity: fields.capacity.optional(),
    status: fields.status,
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'No fields supplied');
const paramsSchema = z
  .object({ tourId: objectId, departureId: objectId.optional() })
  .strict();

exports.validateCreateDeparture = validate({
  params: paramsSchema,
  body: createSchema,
});
exports.validateUpdateDeparture = validate({
  params: paramsSchema,
  body: updateSchema,
});
exports.validateDepartureParams = validate({ params: paramsSchema });
