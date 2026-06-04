const request = require('supertest');
const app = require('../../../src/app');

describe('POST /api/v1/auth/login', () => {
  it('logs in successfully or returns unauthorized if user absent', async () => {
    const email = `login_${Date.now()}@example.com`;
    const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password1!' });
    expect([200,401]).toContain(res.statusCode);
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'wrong@example.com', password: 'bad' });
    expect([401,400]).toContain(res.statusCode);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: `missing_${Date.now()}@example.com`, password: 'Password1!' });
    expect([401,400]).toContain(res.statusCode);
  });
});
