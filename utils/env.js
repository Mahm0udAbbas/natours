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
  STRIPE_MODE: z.enum(['test', 'live']).optional(),
  IMAGE_STORAGE: z.enum(['local', 'imagekit', 'disabled']).optional(),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),
});

exports.validateEnvironment = (environment = process.env) => {
  const parsed = base.parse(environment);
  if (parsed.NODE_ENV === 'production') {
    const production = z.object({
      DATABASE: z.string().min(1),
      APP_URL: z.string().url(),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    });
    production.parse(parsed);

    const stripePrefix =
      parsed.STRIPE_MODE === 'test' ? 'sk_test_' : 'sk_live_';
    z.string().startsWith(stripePrefix).parse(parsed.STRIPE_SECRET_KEY);

    if ((parsed.IMAGE_STORAGE || 'imagekit') === 'imagekit') {
      z.object({
        IMAGEKIT_PUBLIC_KEY: z.string().min(1),
        IMAGEKIT_PRIVATE_KEY: z.string().min(1),
        IMAGEKIT_URL_ENDPOINT: z.string().url(),
      }).parse(parsed);
    }
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
    '<DATABASE_PASSWORD>',
    encodeURIComponent(env.DATABASE_PASSWORD || ''),
  );
};
