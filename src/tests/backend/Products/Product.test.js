const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const request = require('supertest');
const { app } = require('../../../../server');
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

describe('Product tests', () => {
    it('Get returns all products', async () => {
          // 1️⃣ Insert a few test products
        const insertRes = await client.query(`
            INSERT INTO products (name, price)
            VALUES
            ('Test Product A', 100),
            ('Test Product B', 200),
            ('Test Product C', 300)
            RETURNING id, name, price
        `);

        const insertedProducts = insertRes.rows;

        const response = await request(app).get('/products');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

          // 4️⃣ Check that all inserted products are included in the response
        for (const product of insertedProducts) {
            const match = response.body.find(p => p.name === product.name);
            expect(match).toBeDefined();
            expect(Number(match.price)).toBe(Number(product.price));
        }

        // 5️⃣ Cleanup (delete the test products)
        const ids = insertedProducts.map(p => p.id);
        await client.query('DELETE FROM products WHERE id = ANY($1)', [ids]);
    })

    it('Each product has id, name, price', async () => {
        await client.query(`
            INSERT INTO products (name, price)
            VALUES
            ('Test PRODUCT A', 100),
            ('Test Product B', 200),
            ('Test Product C', 300)
            RETURNING id, name, price
            `
        )

        const response = await request(app).get('/products');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        for (const product of response.body) {
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('price');
        }
    });
    afterEach(async () => {
        await client.query("DELETE FROM products WHERE name LIKE 'Test Product%'");
      });
})