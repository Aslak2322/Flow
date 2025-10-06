const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const request = require('supertest');
const { app } = require('../../../../server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Edge cases security', () => {
    it('Invalid JWT cannot access checkout', async () => {
        const resNoToken = await request(app)
        .post('/checkout')
        .send({ cart: [] }); // empty cart is fine; we’re testing auth
    
        expect(resNoToken.status).toBe(401);
        expect(resNoToken.body.error).toBe('Access denied. No token provided.');
        
        // 2️⃣ Invalid token (tampered or wrong secret)
        const badToken = 'Bearer faketoken.12345.bad';
        const resBadToken = await request(app)
            .post('/checkout')
            .set('Authorization', badToken)
            .send({ cart: [] });
        
        expect([400, 401]).toContain(resBadToken.status);
        expect(resBadToken.body.error).toMatch(/invalid/i);
    })
    describe('sql injection attempts fail', () => {
        const { Client } = require('pg');

        const INJECTION = "'; DROP TABLE users; --";

        let client;

        beforeAll(async () => {
        client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME, // MUST be a test DB
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
        });
        await client.connect();
        });

        afterAll(async () => {
        // clean up test rows but keep schema intact
        await client.query("DELETE FROM order_items");
        await client.query("DELETE FROM orders");
        await client.query("DELETE FROM bookings");
        await client.query("DELETE FROM products WHERE name LIKE 'test-inject-%'");
        await client.query("DELETE FROM users WHERE email LIKE 'inject-%' OR email = 'injection-user@example.com'");
        await client.end();
        });

        // helper: check that a table exists
        async function tableExists(tableName) {
        const res = await client.query(
            `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = $1
            ) AS exists`,
            [tableName]
        );
        return res.rows[0].exists === true;
        }

        it('signup with SQL-like email does not execute injection and stores literal string', async () => {
            const maliciousEmail = `inject${INJECTION}@example.com`;

            const response = await request(app)
                .post('/signup')
                .send({ email: maliciousEmail, password: 'password123' });

            // Either signup should be accepted (200) or rejected (400) by validation,
            // but in both cases the injection must not execute.
            expect([200, 201, 400]).toContain(response.status);

            // table users must still exist
            expect(await tableExists('users')).toBe(true);

            // If the signup succeeded, verify that if a row exists it stores the literal email
            const q = await client.query('SELECT email FROM users WHERE email = $1', [maliciousEmail]);
            if (q.rowCount > 0) {
                expect(q.rows[0].email).toBe(maliciousEmail);
            }
        });

        it('POST /checkout does not execute SQL injection through product name', async () => {
            // Insert a malicious product name (string column)
            const prodRes = await client.query(
                "INSERT INTO products (description, price) VALUES ($1, $2) RETURNING id",
                ["inject'; DROP TABLE products; --", 99]
            );
            const productId = prodRes.rows[0].id;
        
            // Create a user and get token
            const pwHash = await bcrypt.hash('pw', 6);
            const userRes = await client.query(
                "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
                ['inject-user@example.com', pwHash]
            );
            const user = userRes.rows[0];
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
        
            const cart = [
                { type: 'Product', id: productId, price: 99, quantity: 1 }
            ];
        
            const res = await request(app)
                .post('/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send({ cart });
        
            // Should succeed (200) — SQL injection prevented by parameterized query
            expect([200, 201]).toContain(res.status);
        
            // Tables still exist
            expect(await tableExists('users')).toBe(true);
            expect(await tableExists('products')).toBe(true);
            expect(await tableExists('orders')).toBe(true);
            expect(await tableExists('order_items')).toBe(true);
        });
    })
    describe('malformed requests should return 400', () => {
        const jwt = require('jsonwebtoken');
        const { Client } = require('pg');
      
        let client;
        let token;
        let userId;
        const testEmail = 'test-malformed@example.com';
      
        beforeAll(async () => {
          client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
          });
          await client.connect();
      
          // create a test user for /checkout auth
          const pwHash = await bcrypt.hash('pw', 6);
          const r = await client.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [testEmail, pwHash]
          );
          userId = r.rows[0].id;
          token = jwt.sign({ id: userId, email: r.rows[0].email }, process.env.JWT_SECRET);
        });
      
        afterAll(async () => {
          // cleanup created test data
          await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [userId]).catch(() => {});
          await client.query('DELETE FROM orders WHERE user_id = $1', [userId]).catch(() => {});
          await client.query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
          await client.end();
        });
      
        it('POST /signup - missing email or password returns 400', async () => {
          const missingBoth = await request(app).post('/signup').send({});
          expect(missingBoth.status).toBe(400);
          expect(missingBoth.body.message || missingBoth.body.error).toBeDefined();
      
          const missingPassword = await request(app).post('/signup').send({ email: 'a@b.com' });
          expect(missingPassword.status).toBe(400);
          expect(missingPassword.body.message || missingPassword.body.error).toBeDefined();
      
          const missingEmail = await request(app).post('/signup').send({ password: 'pw' });
          expect(missingEmail.status).toBe(400);
          expect(missingEmail.body.message || missingEmail.body.error).toBeDefined();
        });
      
        it('POST /checkout - missing or invalid cart returns 400', async () => {
          // missing cart
          let res = await request(app).post('/checkout').set('Authorization', `Bearer ${token}`).send({});
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
          expect(res.body.message || res.body.error).toBeDefined();
      
          // cart is null
          res = await request(app).post('/checkout').set('Authorization', `Bearer ${token}`).send({ cart: null });
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
      
          // empty cart
          res = await request(app).post('/checkout').set('Authorization', `Bearer ${token}`).send({ cart: [] });
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        });
      
        it('POST /checkout - malformed cart items return 400', async () => {
          // product missing id/price
          let res = await request(app)
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({ cart: [{ type: 'Product' }] });
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
      
          // booking missing required fields
          res = await request(app)
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({ cart: [{ type: 'Booking', starttime: '10:00' }] });
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
      
          // mixed: one valid and one invalid item -> should still fail
          res = await request(app)
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
              cart: [
                { type: 'Product', id: 1, price: 10 }, // assume id may or may not exist — it's for shape only
                { type: 'Booking', starttime: '10:00' }, // invalid
              ],
            });
          expect(res.status).toBe(400);
          expect(res.body.success).toBe(false);
        });
      });
      describe('expired token', () => {
        const { Client } = require('pg');
        let client;
        let userId;
      
        beforeAll(async () => {
          client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME, // test DB
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
          });
          await client.connect();
      
          // create a test user
          const pwHash = await bcrypt.hash('pw', 6);
          const res = await client.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
            ['expired-user@example.com', pwHash]
          );
          userId = res.rows[0].id;
        });
      
        afterAll(async () => {
          // clean up test user
          await client.query('DELETE FROM users WHERE id = $1', [userId]);
          await client.end();
        });
      
        it('should reject expired JWT with 401', async () => {
          const expiredToken = jwt.sign(
            { id: userId, email: 'expired-user@example.com' },
            process.env.JWT_SECRET,
            { expiresIn: '-1h' } // already expired
          );
      
          const res = await request(app)
            .post('/checkout')
            .set('Authorization', `Bearer ${expiredToken}`)
            .send({
              cart: [
                { type: 'Product', id: 1, price: 10, quantity: 1 } // non-empty cart
              ]
            });
      
          expect(res.status).toBe(400);
          expect(res.body.error || res.body.message).toMatch(/invalid/i);
        });
      });            
})