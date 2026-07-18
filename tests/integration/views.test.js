const request = require('supertest');
const app = require('../../app');

describe('rendered views', () => {
  test('exposes liveness and database readiness checks', async () => {
    const [live, ready] = await Promise.all([
      request(app).get('/health/live'),
      request(app).get('/health/ready'),
    ]);
    expect(live.status).toBe(200);
    expect(ready.status).toBe(503);
  });

  test('renders the signup form', async () => {
    const response = await request(app).get('/signup');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Create your account');
    expect(response.text).toContain('form--signup');
    expect(response.text).toContain('passwordConfirm');
    expect(response.text).toContain('data-password-toggle');
  });

  test('renders the forgot-password form', async () => {
    const response = await request(app).get('/forgot-password');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Reset your password');
    expect(response.text).toContain('form--forgot-password');
  });

  test('renders the reset-password form with the token', async () => {
    const token = 'a'.repeat(64);
    const response = await request(app).get(`/reset-password/${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Choose a new password');
    expect(response.text).toContain('form--reset-password');
    expect(response.text).toContain(`data-token="${token}"`);
    expect(response.text).toContain('data-password-toggle');
  });
});
