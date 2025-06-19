const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Pool } = require('pg'); // Import PostgreSQL client
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');
const fetch = require('node-fetch'); // Import fetch for making HTTP requests

dotenv.config(); // Load environment variables from .env

const app = express(); // Initialize the app
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware do weryfikacji tokenów JWT z Keycloak
const issuer = process.env.KEYCLOAK_ISSUER
  || 'http://127.0.0.1/realms/projekt';
const jwksUri = process.env.KEYCLOAK_JWKS_URI
  || 'http://keycloak:8080/realms/projekt/protocol/openid-connect/certs';
// dodajemy audience
const audience = process.env.KEYCLOAK_AUDIENCE || 'account';

app.use(
  auth({
    issuerBaseURL: issuer,
    authorizationServerMetadata: {
      issuer: issuer,
      jwks_uri: jwksUri
    },
    audience: audience          // ← tutaj
  })
);

// Sample route
app.get('/', (req, res) => {
    res.send('Welcome to the Cloud Technologies Project Backend!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Configure PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users'); // Fetch users from the database
        res.json(result.rows); // Send the fetched users as JSON response
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/users', async (req, res) => {
    const { name, email } = req.body; // Extract user data from request body
    try {
        const result = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]); // Insert new user into the database
        res.status(201).json(result.rows[0]); // Send the created user as JSON response
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Pobierz wszystkie produkty
app.get('/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching products');
  }
});

// Dodaj nowe zamówienie (z listą pozycji)
app.post('/orders', async (req, res) => {
  const userId = req.auth.payload.sub; // załóżmy, że sub to id użytkownika
  const { items } = req.body; // [{ productId, quantity }, …]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderRes = await client.query(
      'INSERT INTO orders(user_id) VALUES($1) RETURNING id',
      [userId]
    );
    const orderId = orderRes.rows[0].id;
    const insertItem = `INSERT INTO order_items(order_id,product_id,quantity) VALUES($1,$2,$3)`;
    for (let it of items) {
      await client.query(insertItem, [orderId, it.productId, it.quantity]);
    }
    await client.query('COMMIT');
    res.status(201).json({ orderId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).send('Error creating order');
  } finally {
    client.release();
  }
});

// Pobierz zamówienia zalogowanego użytkownika wraz z pozycjami
app.get('/orders', async (req, res) => {
  const userId = req.auth.payload.sub;
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

// Endpoint do pobierania użytkowników z Keycloak (bez ról)
app.get('/kc-users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // baza URL i nazwa realm z env
  const keycloakBase = process.env.KEYCLOAK_BASE_URL || 'http://127.0.0.1';
  const realm       = process.env.KEYCLOAK_REALM     || 'projekt';
  const adminUrl    = `${keycloakBase}/admin/realms/${realm}`;

  try {
    const kcRes = await fetch(
      `${adminUrl}/users`,
      { headers: { Authorization: 'Bearer ' + token } }
    );
    if (!kcRes.ok) {
      console.error('KC admin fetch failed:', await kcRes.text());
      return res.status(kcRes.status).send('Error fetching Keycloak users');
    }
    const raw = await kcRes.json();
    const users = raw.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      enabled: u.enabled
    }));
    res.json(users);
  } catch (e) {
    console.error('Unexpected error fetching KC users:', e);
    res.status(500).send('Error fetching Keycloak users');
  }
});