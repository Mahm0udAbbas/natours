const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const User = require('../../models/userModel');
const { authHeader, createUser } = require('../helpers/factories');

describe('authentication API', () => {
  test('signs up a user and returns a token and secure cookie', async () => {
    const response = await request(app).post('/api/v1/users/signup').send({
      name: 'New User',
      email: 'NEW@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe('new@example.com');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(await User.countDocuments()).toBe(1);
  });

  test('rejects malformed signup input', async () => {
    const response = await request(app).post('/api/v1/users/signup').send({
      name: 'User',
      email: 'not-an-email',
      password: 'short',
      passwordConfirm: 'different',
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('fail');
  });

  test('logs in with valid credentials', async () => {
    await createUser({ email: 'login@example.com' });

    const response = await request(app).post('/api/v1/users/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });

  test('rejects invalid credentials', async () => {
    await createUser({ email: 'login@example.com' });

    const response = await request(app).post('/api/v1/users/login').send({
      email: 'login@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
  });

  test('requires authentication for the current-user endpoint', async () => {
    const response = await request(app).get('/api/v1/users/me');
    expect(response.status).toBe(401);
  });

  test('returns the authenticated user', async () => {
    const user = await createUser();
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.data.data.email).toBe(user.email);
  });
});
