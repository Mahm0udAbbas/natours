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

  test('encodes database passwords in connection templates', () => {
    expect(
      databaseUrl({
        NODE_ENV: 'production',
        DATABASE: 'mongodb://u:<PASSWORD>@host/db',
        DATABASE_PASSWORD: 'a@b',
      }),
    ).toContain('a%40b');
  });
});
