const { databaseUrl, validateEnvironment } = require('../../utils/env');

const base = {
  NODE_ENV: 'test',
  JWT_SECRET: 'a-very-long-test-secret-that-is-safe',
  JWT_EXPIRES_IN: '1d',
  JWT_COOKIE_EXPIRES_IN: '1',
  DATABASE_LOCAL: 'mongodb://localhost/test',
};

describe('environment configuration', () => {
  test('parses a valid non-production environment', () => {
    expect(validateEnvironment(base).PORT).toBe(3000);
  });

  test('requires production services and live Stripe keys', () => {
    expect(() =>
      validateEnvironment({ ...base, NODE_ENV: 'production' }),
    ).toThrow();
  });

  test('supports an explicit test-payment deployment with uploads disabled', () => {
    expect(
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        DATABASE: 'mongodb://localhost/production-test',
        APP_URL: 'https://example.herokuapp.com',
        STRIPE_MODE: 'test',
        STRIPE_SECRET_KEY: 'sk_test_example',
        STRIPE_WEBHOOK_SECRET: 'whsec_example',
        IMAGE_STORAGE: 'disabled',
      }),
    ).toBeDefined();
  });

  test('encodes database passwords in connection templates', () => {
    expect(
      databaseUrl({
        NODE_ENV: 'production',
        DATABASE: 'mongodb://u:<DATABASE_PASSWORD>@host/db',
        DATABASE_PASSWORD: 'a@b',
      }),
    ).toContain('a%40b');
  });
});
