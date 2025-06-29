const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');
const fetch = require('node-fetch');
const checkJwt = require('./auth');
const { getAdminToken } = require('./kc-admin');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status:"ok" }));

// JWT authentication middleware
app.use(checkJwt);

// Public route for testing
app.get('/', (req, res) => {
    res.send('Welcome to the Cloud Technologies Project Backend!');
});

// Protected route example
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing or further configuration
module.exports = app;

// Database connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test database connection
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users'); 
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Create a new user
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    try {
        const result = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, description, price::float AS price, stock
      FROM products
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching products', error: e.message });
  }
});

// Get a single product by ID
app.post('/orders', async (req, res) => {
  try {
    const userId = req.auth.sub;

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ message: 'No items provided' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const orderRes = await client.query(
        'INSERT INTO orders(user_id) VALUES($1) RETURNING id',
        [userId]
      );
      const orderId = orderRes.rows[0].id;

      const insertItem = 'INSERT INTO order_items(order_id,product_id,quantity) VALUES($1,$2,$3)';
      for (const it of items) {
        await client.query(insertItem, [orderId, it.productId, it.quantity]);
      }
      await client.query('COMMIT');
      return res.status(201).json({ orderId });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('POST /orders error:', e);
    return res.status(500).json({ message: 'Error creating order', error: e.message });
  }
});

// Get all orders for the authenticated user
app.get('/orders', async (req, res) => {
  const userId = req.auth.sub;
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.created_at,
         json_agg(json_build_object(
           'productId', oi.product_id,
           'quantity', oi.quantity
         )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id`,
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching orders');
  }
});

// Get all Keycloak users (requires admin token)
app.get('/kc-users', async (_req, res) => {
  try {
    const token = await getAdminToken();
    const url = `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`;
    const kcRes = await fetch(url, { headers:{ Authorization:'Bearer '+token } });
    const users = await kcRes.json();
    if (!kcRes.ok) return res.status(kcRes.status).json({ message:'KC admin API error', details:users });
    res.json(users.map(u => ({
      id: u.id, username: u.username, email: u.email, enabled: u.enabled
    })));
  } catch(e) {
    console.error(e);
    res.status(500).json({ message:'Internal Server Error', error:e.message });
  }
});