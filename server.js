const express = require('express');
const app = express();
const PORT = 4000; // use a different port
const { Client } = require('pg');
const cors = require('cors');

// Replace these with your actual database settings
const client = new Client({
  user: 'aslakbennedsen',
  host: 'localhost',        // or remote host like 'db.example.com'
  database: 'Flow',
  password: 'Milla-2009',
  port: 5432,               // default PostgreSQL port
});

client.connect(); // <== REQUIRED to actually open the connection

app.use(express.json());

app.use(cors());

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });

  app.get('/bookings', async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM bookings'); 
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  app.get('/products', async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM products')
      console.log('Products from DB:', result.rows);
      res.json(result.rows)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to fetch products'})
    }
  })

  app.post('/bookings', async (req, res) => {
    try {
      const { starttime, endtime, user_id } = req.body
      const result = await client.query('INSERT INTO bookings (starttime, endtime, user_id) VALUES ($1, $2, $3) RETURNING *', [starttime, endtime, user_id]
      );
      res.json(result.rows[0])
    } catch (error) {
      console.error(error);
      res.status(500).json({error: 'Failed to post booking'})
    }
  });

  app.post('/cart', async (req, res) => {
    try {
      const { user_id, product_id, quantity } = req.body;
      const result = await client.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *', [user_id, product_id, quantity]);
      res.json(result.rows[0])
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add to cart'})
    }
  })
  
  app.get('/cart/:user_id', async (req, res) => {
    try {
      const { user_id } = req.params;
      const result = await client.query(
        `SELECT c.id, c.quantity, p.*
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = $1`, [user_id]
      );
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to get cart'})
    }
  })

  app.put('/cart/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const result = await client.query(
      'UPDATE cart_items SET quantity=$1 WHERE id=$2 RETURNING *',
      [quantity, id]
    );
    res.json(result.rows[0]);
  });

  app.delete('/cart/:id', async (req, res) => {
    const { id } = req.params;
    await client.query('DELETE FROM cart_items WHERE id=$1', [id]);
    res.json({ message: 'Item removed' });
  });

  app.post("/checkout", async (req, res) => {
    const { cart, user_id } = req.body;
  
    const products = cart.filter(item => item.type === "Product");
    const bookings = cart.filter(item => item.type === "Booking");
  
    try {
      // 1️⃣ Insert products into orders + order_items
      if (products.length > 0) {
        const orderResult = await client.query(
          "INSERT INTO orders(user_id, date_created) VALUES($1, NOW()) RETURNING id",
          [user_id]
        );
        const orderId = orderResult.rows[0].id;
  
        for (let product of products) {
          await client.query(
            "INSERT INTO order_items(order_id, product_id, quantity, price) VALUES($1, $2, $3, $4)",
            [orderId, product.id, product.quantity || 1, product.price]
          );
        }
      }
  
      // 2️⃣ Insert bookings into bookings + booking_items
      for (let booking of bookings) {
        await client.query(
          "INSERT INTO bookings(starttime, endtime, user_id, date, price) VALUES($1, $2, $3, $4, $5)",
          [booking.starttime, booking.endtime, booking.user_id, booking.date, booking.price]
        );
      }
      res.json({ success: true });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
