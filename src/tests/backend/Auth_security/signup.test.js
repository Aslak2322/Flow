const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const request = require('supertest');
const bcrypt = require('bcrypt');
const { app } = require('../../../../server.js');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

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

describe('signup', () => {
  it('rejects duplicate email', async () => {

    await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      ['test@example.com', await bcrypt.hash('1234', 10)]
    );

    const res = await request(app)
      .post('/signup')
      .send({ email: 'test@example.com', password: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already in use');
  });

  it('hashes the password before storing in DB', async () => {
    const email = 'hash_test@example.com';
    const plainPassword = 'supersecret123';

    // 1️⃣ Call signup
    await request(app)
      .post('/signup')
      .send({ email, password: plainPassword })
      .expect(200);

    // 2️⃣ Fetch user from DB
    const result = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    expect(user).toBeTruthy();
    expect(user.password_hash).not.toEqual(plainPassword); // not stored as plain text

    // 3️⃣ Check that the hash matches the plain password
    const isValid = await bcrypt.compare(plainPassword, user.password_hash);
    expect(isValid).toBe(true);
  });
  it('fails with wrong password', async () => {
    const email = 'wrongpass@example.com';
    const correctPassword = 'correct123';
    const wrongPassword = 'incorrect456';

    // 1️⃣ Insert a test user into the DB with a hashed password
    const passwordHash = await bcrypt.hash(correctPassword, 10);
    await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [email, passwordHash]
    );

    // 2️⃣ Attempt to login with the wrong password
    const res = await request(app)
      .post('/login')
      .send({ email, password: wrongPassword });

    // 3️⃣ Expect 400 status
    expect(res.status).toBe(400);

    // 4️⃣ Optional: check error message
    expect(res.body.error).toContain('Invalid'); // matches "Invalid credentials"

    // 5️⃣ Clean up the user
    await client.query('DELETE FROM users WHERE email = $1', [email]);
  });
  it('returns a JWT with correct payload on successful login', async () => {
    const email = 'jwt_test@example.com';
    const password = 'mypassword123';

    // 1️⃣ Insert user into DB
    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, passwordHash]
    );
    const userId = insertResult.rows[0].id;

    // 2️⃣ Login with correct credentials
    const res = await request(app)
      .post('/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy(); // JWT is returned

    // 3️⃣ Decode the JWT
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);

    // 4️⃣ Check payload
    expect(decoded.id).toBe(userId);   // user ID matches
    expect(decoded.email).toBe(email); // email matches

    // 5️⃣ Clean up
    await client.query('DELETE FROM users WHERE email = $1', [email]);
  });
});

afterEach(async () => {
  await client.query("DELETE FROM users WHERE email LIKE '%@example.com'");
});