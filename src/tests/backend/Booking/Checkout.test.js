/**
 * @jest-environment node
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

require('dotenv').config();
const request = require('supertest');
const { app } = require('../../../../server');
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
  await client.query('DELETE FROM order_items');
  await client.query('DELETE FROM orders');
  await client.query('DELETE FROM bookings');
  await client.query('DELETE FROM products');
  await client.query('DELETE FROM users');
  await client.end();
});

beforeEach(async () => {
  await client.query('DELETE FROM order_items');
  await client.query('DELETE FROM orders');
  await client.query('DELETE FROM bookings');
  await client.query('DELETE FROM products');
  await client.query('DELETE FROM users');
});

test('POST /checkout inserts products into orders and order_items', async () => {
  const userRes = await client.query(
    "INSERT INTO users(email, password_hash) VALUES('checkout@test.com', 'hash') RETURNING id, email"
  );
  const user = userRes.rows[0];

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const productRes = await client.query(
    "INSERT INTO products(name, price) VALUES('Test Product', 100) RETURNING id, price"
  );
  const product = productRes.rows[0];

  const cart = [
    { type: 'Product', id: product.id, price: product.price, quantity: 2 },
  ];

  const response = await request(app)
    .post('/checkout')
    .set('Authorization', `Bearer ${token}`)
    .send({ cart });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);

  const orderRes = await client.query('SELECT * FROM orders WHERE user_id = $1', [user.id]);
  expect(orderRes.rowCount).toBe(1);
  const orderId = orderRes.rows[0].id;

  const itemRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  expect(itemRes.rowCount).toBe(1);

  const item = itemRes.rows[0];
  expect(item.product_id).toBe(product.id);
  expect(item.quantity).toBe(2);
  expect(Number(item.price)).toBe(product.price);
});

test('POST /checkout inserts bookings from cart', async () => {
  const userRes = await client.query(
    "INSERT INTO users(email, password_hash) VALUES('booking@test.com', 'hash') RETURNING id, email"
  );
  const user = userRes.rows[0];

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const cart = [
    {
      type: 'Booking',
      date: '2025-10-10',
      starttime: '10:00',
      endtime: '11:00',
      price: 50,
    },
    {
      type: 'Booking',
      date: '2025-10-11',
      starttime: '12:00',
      endtime: '13:30',
      price: 75,
    },
  ];

  const response = await request(app)
    .post('/checkout')
    .set('Authorization', `Bearer ${token}`)
    .send({ cart });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);

  const result = await client.query(
    "SELECT date::text, starttime, endtime, price FROM bookings WHERE user_id = $1 ORDER BY date",
    [user.id]
  );

  expect(result.rows).toHaveLength(cart.length);

  for (let i = 0; i < cart.length; i++) {
    const dbBooking = result.rows[i];
    const b = cart[i];

    expect(dbBooking.date).toBe(b.date);
    expect(dbBooking.starttime).toBe(b.starttime);
    expect(dbBooking.endtime).toBe(b.endtime);
    expect(Number(dbBooking.price)).toBe(b.price);
  }
});

test('POST /checkout rejects invalid cart', async () => {
    // Insert a valid user
    const userRes = await client.query(
      "INSERT INTO users(email, password_hash) VALUES('invalidcart@test.com', 'hash') RETURNING id, email"
    );
    const user = userRes.rows[0];
  
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  
    // Example invalid carts
    const invalidCarts = [
      null, // not an array
      [], // empty cart
      [{ type: 'Product' }], // missing id, price
      [{ type: 'Booking', starttime: '10:00' }], // missing endtime, date, price
    ];
  
    for (const cart of invalidCarts) {
      const response = await request(app)
        .post('/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ cart });
  
      // Expect server to respond with 400 or error
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toBeDefined();
    }
  });
  

