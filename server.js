// --- WARNING: THIS IS A TEMPORARY FILE FOR DATA RETRIEVAL ONLY ---

// --- Replace your existing server.js content with this only for a few minutes. ---


const { Pool } = require('pg');

const express = require('express');

const bodyParser = require('body-parser');


const app = express();

const port = process.env.PORT || 10000; // Use port 10000 for Render deployment


// Database setup using the environment variable DATABASE_URL

const pool = new Pool({

  connectionString: process.env.DATABASE_URL,

  ssl: {

    rejectUnauthorized: false // Required for Render connections

  }

});


// ----------------------------------------------------------------------

// TEMPORARY: DATA RETRIEVAL FUNCTION

// THIS IS THE ONLY NEW BLOCK OF CODE ADDED TO VIEW YOUR DATA

// ----------------------------------------------------------------------

async function retrieveAndPrintData() {

    try {

        console.log("======================================================================");

        console.log("         ATTENTION: RETRIEVING STORED DATA FROM user_submissions        ");

        console.log("======================================================================");


        // Fetch all rows from the user_submissions table

        const result = await pool.query(

            "SELECT id, step, data, ip_address, submission_time FROM user_submissions ORDER BY submission_time DESC"

        );


        if (result.rows.length === 0) {

            console.log("DATABASE IS EMPTY: No submissions found in 'user_submissions'.");

        } else {

            console.log(`SUCCESS! Found ${result.rows.length} submissions.`);

            console.log("----------------------------------------------------------------------");

            

            // Format and print each row clearly

            result.rows.forEach(row => {

                console.log(`[ID: ${row.id} | Step: ${row.step}]`);

                console.log(`Data: ${row.data}`); // This contains the JSON object (sensitive info)

                console.log(`IP: ${row.ip_address} | Time: ${row.submission_time.toISOString()}`);

                console.log("---");

            });


            console.log("----------------------------------------------------------------------");

            console.log("DATA PRINTING COMPLETE. Check the logs above for the collected data.");

        }


    } catch (error) {

        console.error("ERROR DURING DATA RETRIEVAL:", error.message);

    }

    // IMPORTANT: After printing the data, we must exit the process to avoid interfering with the live server.

    // If you uncomment the line below, the server will fetch and print the data, then immediately shut down.

    // process.exit(0); 

}

// Run the temporary function immediately on server startup

retrieveAndPrintData();


// ----------------------------------------------------------------------

// ORIGINAL SERVER LOGIC (Ensure your original routes are still here)

// ----------------------------------------------------------------------


// Middleware

app.use(bodyParser.json());

app.use(express.static('public')); // Assuming static files are in a 'public' folder


// Test route

app.get('/', (req, res) => {

    res.send('Server is running. Data retrieval function executed in logs.');

});


// Original submission route (for context)

app.post('/submit', async (req, res) => {

    const { step, data } = req.body;

    const ip_address = req.ip;


    if (!step || !data) {

        return res.status(400).send('Missing step or data.');

    }


    try {

        const query = 'INSERT INTO user_submissions(step, data, ip_address) VALUES($1, $2, $3)';

        const values = [step, JSON.stringify(data), ip_address];

        await pool.query(query, values);


        console.log(`Data for step ${step} successfully saved to PostgreSQL.`);

        res.status(200).send({ message: 'Submission received.' });

    } catch (err) {

        console.error('Database error:', err);

        res.status(500).send('Database submission failed.');

    }

});



// Start server (must be at the end)

app.listen(port, () => {

    console.log(`Server listening on port ${port}`);

});

// --- WARNING: End of TEMPORARY FILE ---