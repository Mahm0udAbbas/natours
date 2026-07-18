const { z } = require('zod');

const base = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),
  JWT_COOKIE_EXPIRES_IN: z.coerce.number().positive(),
  DATABASE_LOCAL: z.string().optional(),
  DATABASE: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  APP_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),
});

exports.validateEnvironment = (environment = process.env) => {
  const parsed = base.parse(environment);
  if (parsed.NODE_ENV === 'production') {
    z.object({
      DATABASE: z.string().min(1),
      APP_URL: z.string().url(),
      STRIPE_SECRET_KEY: z.string().startsWith('sk_live_'),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
      IMAGEKIT_PUBLIC_KEY: z.string().min(1),
      IMAGEKIT_PRIVATE_KEY: z.string().min(1),
      IMAGEKIT_URL_ENDPOINT: z.string().url(),
    }).parse(parsed);
  } else if (!parsed.DATABASE_LOCAL && !parsed.DATABASE) {
    throw new Error('DATABASE_LOCAL or DATABASE is required');
  }
  return parsed;
};

exports.databaseUrl = (env) => {
  const template =
    env.NODE_ENV === 'production'
      ? env.DATABASE
      : env.DATABASE_LOCAL || env.DATABASE;
  return template.replace(
    '<PASSWORD>',
    encodeURIComponent(env.DATABASE_PASSWORD || ''),
  );
};
