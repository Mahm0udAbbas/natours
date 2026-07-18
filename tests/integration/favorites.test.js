const request = require('supertest');
require('../helpers/database');
const app = require('../../app');
const User = require('../../models/userModel');
const { authHeader, createTour, createUser } = require('../helpers/factories');

describe('favorites API', () => {
  test('requires authentication', async () => {
    const response = await request(app).get('/api/v1/users/me/favorites');

    expect(response.status).toBe(401);
  });

  test('adds a tour once and lists the populated favorite', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const endpoint = `/api/v1/users/me/favorites/${tour.id}`;
    const authorization = authHeader(user);

    const added = await request(app)
      .post(endpoint)
      .set('Authorization', authorization);
    const addedAgain = await request(app)
      .post(endpoint)
      .set('Authorization', authorization);
    const listed = await request(app)
      .get('/api/v1/users/me/favorites')
      .set('Authorization', authorization);

    expect(added.status).toBe(200);
    expect(addedAgain.status).toBe(200);
    expect(listed.status).toBe(200);
    expect(listed.body.results).toBe(1);
    expect(listed.body.data.favorites[0]).toEqual(
      expect.objectContaining({ _id: tour.id, name: tour.name }),
    );
    const storedUser = await User.findById(user.id).select('+favorites');
    expect(storedUser.favorites).toHaveLength(1);
  });

  test('keeps each user favorites private', async () => {
    const [tour, owner, other] = await Promise.all([
      createTour(),
      createUser(),
      createUser(),
    ]);
    await request(app)
      .post(`/api/v1/users/me/favorites/${tour.id}`)
      .set('Authorization', authHeader(owner));

    const response = await request(app)
      .get('/api/v1/users/me/favorites')
      .set('Authorization', authHeader(other));

    expect(response.status).toBe(200);
    expect(response.body.results).toBe(0);
    expect(response.body.data.favorites).toEqual([]);
  });

  test('removes a favorite idempotently', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    const endpoint = `/api/v1/users/me/favorites/${tour.id}`;
    const authorization = authHeader(user);
    await request(app).post(endpoint).set('Authorization', authorization);

    const removed = await request(app)
      .delete(endpoint)
      .set('Authorization', authorization);
    const removedAgain = await request(app)
      .delete(endpoint)
      .set('Authorization', authorization);

    expect(removed.status).toBe(200);
    expect(removed.body.data.favorites).toEqual([]);
    expect(removedAgain.status).toBe(200);
    expect(removedAgain.body.data.favorites).toEqual([]);
  });

  test('rejects invalid and unknown tour ids', async () => {
    const user = await createUser();
    const authorization = authHeader(user);
    const invalid = await request(app)
      .post('/api/v1/users/me/favorites/not-an-id')
      .set('Authorization', authorization);
    const unknown = await request(app)
      .post('/api/v1/users/me/favorites/507f1f77bcf86cd799439011')
      .set('Authorization', authorization);

    expect(invalid.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  test('does not expose favorites from the general user endpoint', async () => {
    const [tour, user] = await Promise.all([createTour(), createUser()]);
    await User.findByIdAndUpdate(user.id, {
      $addToSet: { favorites: tour.id },
    });

    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.data.data.favorites).toBeUndefined();
  });
});
