require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000; 
const { Client } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

// Database connection
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // allows self-signed / Render SSL
  },              
});

client.connect();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:3000',
  credentials: true
}));

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email or password missing'});
    const hashed = await bcrypt.hash(password, 10);
    const existing = await client.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (existing.rowCount > 0) return res.status(400).json({ error: 'Email already in use' });

    const result = await client.query(
      'INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email',
      [email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, user, token });
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

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/products', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post("/checkout", auth, async (req, res) => {
  const { cart } = req.body;
  if (!Array.isArray(cart) || cart.length === 0) return res.status(400).json({ success: false, message: "Cart is invalid or empty" });

  const user_id = req.user.id;
  const products = cart.filter(i => i.type === "Product");
  const bookings = cart.filter(i => i.type === "Booking");

  try {
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

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'build')));

  // Fallback for React Router
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Start server
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, auth };
