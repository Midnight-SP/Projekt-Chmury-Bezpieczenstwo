const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Pool } = require('pg'); // Import PostgreSQL client
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');

dotenv.config(); // Load environment variables from .env

const app = express(); // Initialize the app
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware do weryfikacji tokenów JWT z Keycloak
app.use(
  auth({
    issuerBaseURL: 'http://localhost:8080/realms/projekt', // adres Keycloak + realm
    audience: 'frontend', // client_id z Keycloak
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