const request = require('supertest');
const app = require('./app');

describe('GET /', () => {
  it('powinno zwrócić powitalną wiadomość', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Welcome to the Cloud Technologies Project Backend!/);
  });
});