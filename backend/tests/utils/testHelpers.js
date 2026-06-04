const request = require('supertest');
const app = require('../../src/app');

async function createTestUser(){
  return { email: 'test@example.com', password: 'Password1!', full_name: 'Test User' };
}

async function getAuthToken(email, password){
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body?.data?.access || res.body?.data?.tokens?.access;
}

module.exports = { createTestUser, getAuthToken };
