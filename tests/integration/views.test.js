const request = require('supertest');
const app = require('../../app');

describe('rendered views', () => {
  test('renders the signup form', async () => {
    const response = await request(app).get('/signup');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Create your account');
    expect(response.text).toContain('form--signup');
    expect(response.text).toContain('passwordConfirm');
  });
});
