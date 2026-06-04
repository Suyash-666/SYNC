const request = require('supertest');
const app = require('../../../src/app');

describe('POST /api/v1/auth/refresh', () => {
  it('rejects invalid token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'invalid.token.value' });
    expect([401,400]).toContain(res.statusCode);
  });
});
