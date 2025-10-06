const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder; 
global.TextDecoder = global.TextDecoder || TextDecoder;

const { Client } = require('pg');
const bcrypt = require('bcrypt');

let client;
let userId;

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

beforeEach(async () => {
  await client.query('BEGIN'); // start transaction

  // Insert test user
  const hashed = await bcrypt.hash('password1', 10);
  const userRes = await client.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    ['user1@ixample.com', hashed]
  );
  userId = userRes.rows[0].id;

  // Insert a single booking
  await client.query(
    'INSERT INTO bookings (user_id, date, starttime, endtime, price) VALUES ($1, $2, $3, $4, $5)',
    [userId, '2025-10-10', '10:00', '11:00', 50]
  );
});

afterEach(async () => {
  await client.query('ROLLBACK'); // automatically cleans up
});

test('checks bookings in the database', async () => {
  const result = await client.query(
    "SELECT date::text, starttime, endtime, user_id, price FROM bookings"
  );

  const booking = result.rows[0];

  expect(booking.date).toBe('2025-10-10'); // string comparison
  expect(booking.user_id).toBe(userId);
  expect(booking.starttime).toBe('10:00');
  expect(booking.endtime).toBe('11:00');
  expect(Number(booking.price)).toBe(50);
});




  


  
  
