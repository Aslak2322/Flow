require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 4000; // use a different port
const { Client } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Replace these with your actual database settings
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,              
});

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded; // { id: ..., email: ... }
    next();
  } catch (err) {
    console.log(req)
    res.status(400).json({ error: 'Invalid token' });
  }
};

client.connect(); // <== REQUIRED to actually open the connection

app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

if (require.main === module) {
  // Only listen if this file is run directly with "node server.js"
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

  app.post('/signup', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email or password missing'});
      }

      const hashed = await bcrypt.hash(password, 10);

      const existing = await client.query('SELECT 1 FROM users WHERE email=$1', [email]);
      if (existing.rowCount > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
  
      const result = await client.query(
        'INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email',
        [email, hashed]
      );
      const user = result.rows[0];
  
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ success: true, user, token }); // send token for automatic login
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await client.query('SELECT * FROM users WHERE email=$1', [email]);
      const user = result.rows[0];
  
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ success: true, user: { id: user.id, email: user.email }, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
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
  
  app.post("/checkout", auth, async (req, res) => {
    const { cart } = req.body;

    // 1️⃣ Validate cart
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is invalid or empty" });
    }

    for (let item of cart) {
      if (!item.type) {
        return res.status(400).json({ success: false, message: "Cart item missing type" });
      }

      if (item.type === "Product") {
        if (!item.id || typeof item.price !== "number") {
          return res.status(400).json({ success: false, message: "Product item is invalid" });
        }
      }

      if (item.type === "Booking") {
        if (!item.date || !item.starttime || !item.endtime || typeof item.price !== "number") {
          return res.status(400).json({ success: false, message: "Booking item is invalid" });
        }
      }
    }

    const user_id = req.user.id;
  
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
          [booking.starttime, booking.endtime, user_id, booking.date, booking.price]
        );
      }
      res.json({ success: true });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });


  module.exports = { app, auth };