const request = require('supertest');
const app = require('../../../src/app');

describe('POST /api/v1/auth/signup', () => {
  it('creates account successfully', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      full_name: 'Test User',
      email: `user_${Date.now()}@example.com`,
      password: 'Password1!',
      confirm_password: 'Password1!'
    });
    expect(res.statusCode).toBe(201);
  });

  it('rejects duplicate email', async () => {
    const email = `dup_${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/signup').send({ full_name: 'A', email, password: 'Password1!', confirm_password: 'Password1!' });
    const res = await request(app).post('/api/v1/auth/signup').send({ full_name: 'B', email, password: 'Password1!', confirm_password: 'Password1!' });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('rejects invalid password', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      full_name: 'Test User',
      email: `bad_${Date.now()}@example.com`,
      password: 'short',
      confirm_password: 'short'
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
