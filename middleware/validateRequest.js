const { z } = require('zod');
const AppError = require('../utils/appError');

const formatPath = (path) => {
  if (!path || path.length === 0) return '';
  return `${path.join('.')}: `;
};

const formatZodError = (error) =>
  error.issues
    .map((issue) => `${formatPath(issue.path)}${issue.message}`)
    .join('. ');

const assignParsedValue = (req, key, value) => {
  if (key === 'query') {
    Object.keys(req.query).forEach((queryKey) => delete req.query[queryKey]);
    Object.assign(req.query, value);
    return;
  }

  req[key] = value;
};

exports.z = z;

exports.validate = (schemas) => (req, res, next) => {
  // console.log('Validating request with schemas: ', Object.entries(schemas));
  // console.log('Validating request with schemas: ', req.body);
  const entries = Object.entries(schemas);
  const failedValidation = entries.find(([key, schema]) => {
    // console.log(`Validating ${key} with schema: `, schema);
    const result = schema.safeParse(req[key] || {});

    // console.log(`Result for ${key}: `, result);
    if (result.success) {
      assignParsedValue(req, key, result.data);
      return false;
    }

    return true;
  });

  if (failedValidation) {
    const [key, schema] = failedValidation;
    const result = schema.safeParse(req[key] || {});
    return next(new AppError(formatZodError(result.error), 400));
  }

  next();
};
