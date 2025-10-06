const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const request = require('supertest'); // for HTTP requests
const { app } = require('../../../../server.js'); // path to your Express app
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

// Optional: if you want DB setup/cleanup
const { Client } = require('pg');
let client;

beforeAll(async () => {
  client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

describe('login', () => {
    it('fails with wrong email', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'nonexistent@example.com', password: 'anyPassword' });
  
      expect(res.status).toBe(400); // should reject
      expect(res.body.error).toContain('Invalid'); // optional: check the error message
    });
    it('fails with wrong password', async () => {
      const email = 'test@example.com';
      const correctPassword = 'correctPassword123';
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(correctPassword, 10);
  
      // Insert user into the DB
      await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
        [email, hashedPassword]
      );
  
      // Act: try to log in with the wrong password
      const response = await request(app)
        .post('/login')
        .send({ email, password: 'wrongPassword!' });
  
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message || response.body.error).toMatch(/invalid/i);
  
      // Clean up: remove the test user
      await client.query('DELETE FROM users WHERE email = $1', [email]);
    });
    it('returns a jwt containing correct payload on successful login', async () => {
      const email = 'test@example.com';
      const correctPassword = 'correctPassword123';

      const hashedPassword = await bcrypt.hash(correctPassword, 10);

      await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
        [email, hashedPassword]
      );

      const response = await request(app)
        .post('/login')
        .send({ email, password: correctPassword });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.email).toBe(email);
      expect(decoded.id).toBeDefined();

      await client.query('DELETE FROM users WHERE email = $1', [email]);
    })
  });