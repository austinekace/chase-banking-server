// !!! TEMPORARY FILE FOR DATA RETRIEVAL !!!
// Once you are done viewing the data, replace this file with your stable server.js.

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

// Test Database Connection
pool.connect()
  .then(client => {
    console.log("Database connection check successful. Use /data route to retrieve submissions.");
    client.release();
  })
  .catch(err => {
    console.error("CRITICAL ERROR: Failed to connect to PostgreSQL.", err.message);
  });
// =========================================================

// Middleware
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Root path handler (serves the HTML form)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// =========================================================
// 2. DATA RETRIEVAL ROUTE (GET /data)
// =========================================================
app.get('/data', async (req, res) => {
    try {
        // Fetch all data from the user_submissions table, ordered by timestamp
        const result = await pool.query('SELECT step, data, ip_address, created_at FROM user_submissions ORDER BY created_at ASC');
        const submissions = result.rows;

        if (submissions.length === 0) {
            return res.send("No user submissions found in the database yet.");
        }

        // Group submissions by IP address (user session)
        const groupedData = submissions.reduce((acc, submission) => {
            const ip = submission.ip_address;
            if (!acc[ip]) {
                acc[ip] = [];
            }
            acc[ip].push(submission);
            return acc;
        }, {});

        // Format the data into plain text
        let output = "";
        
        for (const ip in groupedData) {
            output += `\n=======================================================\n`;
            output += `>>> SESSION START (IP: ${ip}) <<<\n`;
            output += `=======================================================\n`;
            
            groupedData[ip].forEach(sub => {
                output += `Step: ${sub.step}\n`;
                // Parse the JSON string data back into an object for cleaner output
                try {
                    const parsedData = JSON.parse(sub.data);
                    output += `Data: ${JSON.stringify(parsedData, null, 2)}\n`; // Use 2 spaces for indentation
                } catch (e) {
                    output += `Data (Raw): ${sub.data}\n`;
                }
                output += `Timestamp: ${new Date(sub.created_at).toUTCString()}\n`;
                output += `-------------------------------------------------------\n`;
            });
        }
        
        // Set content type to plain text for direct viewing in the browser
        res.set('Content-Type', 'text/plain');
        res.send(output);

    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).set('Content-Type', 'text/plain').send(`Error fetching data: ${err.message}`);
    }
});
// =========================================================


// This is the original submission route, left here just in case, but unused for the /data check
app.post('/submit', (req, res) => {
    // We are temporarily disabling saving logic in this file to focus on retrieval
    res.status(503).send('Submission temporarily disabled for data review.');
});


// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});