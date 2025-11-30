const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors'); // Added for safety, though not strictly needed for same-server frontend/backend

// Check for and use the DATABASE_URL environment variable provided by Render
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('FATAL ERROR: DATABASE_URL environment variable is not set. Cannot connect to PostgreSQL.');
    process.exit(1); // Exit if essential config is missing
}

const pool = new Pool({
    connectionString: databaseUrl,
    // Add SSL configuration for Render deployment
    ssl: {
        rejectUnauthorized: false
    }
});

const app = express();
const PORT = process.env.PORT || 10000; // Render usually provides a port, often 10000

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies from POST requests
app.use(express.static(path.join(__dirname, '.'))); // Serve static files (index.html, etc.)

// Function to initialize the database table
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_submissions (
                id SERIAL PRIMARY KEY,
                step VARCHAR(50) NOT NULL,
                data JSONB NOT NULL,
                submission_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ip_address INET
            );
        `);
        client.release();
        console.log('Database table "user_submissions" is ready.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
        // Do not exit here, allow server to run but log error
    }
}

// Route to handle data submission from the frontend
app.post('/submit-data', async (req, res) => {
    const { step, data } = req.body;
    const ipAddress = req.ip; // Get IP address of the requester

    if (!step || !data) {
        return res.status(400).send({ message: 'Missing "step" or "data" fields.' });
    }

    try {
        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO user_submissions (step, data, ip_address) VALUES ($1, $2, $3) RETURNING *',
            [step, data, ipAddress]
        );
        client.release();

        console.log(`Data for step "${step}" successfully saved to PostgreSQL. ID: ${result.rows[0].id}`);
        
        // You would integrate your webhook forwarding here if you had one.
        // For now, we just acknowledge the data was saved.
        
        res.status(200).send({ 
            message: `Data received and saved for step: ${step}`, 
            // In a real scenario, you'd trigger the next frontend step here
            // For now, we'll let the frontend handle the navigation
        });

    } catch (err) {
        console.error('Error saving data to database:', err.message);
        res.status(500).send({ message: 'Internal server error while saving data.' });
    }
});

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server only after database is initialized
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running successfully.`);
        console.log(`Listening on port ${PORT}...`);
    });
}).catch(error => {
    console.error('Failed to start server due to DB initialization error:', error);
});