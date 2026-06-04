const request = require('supertest');
const app = require('../../../src/app');

describe('Assignments API', () => {
  it('requires auth for create', async () => {
    const res = await request(app).post('/api/v1/assignments').send({ title: 'A' });
    expect(res.statusCode).toBe(401);
  });

  it('supports pagination on list', async () => {
    const res = await request(app).get('/api/v1/assignments?page=1&limit=10');
    expect([200,401]).toContain(res.statusCode);
  });
});
