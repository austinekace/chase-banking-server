// --- WARNING: THIS IS A TEMPORARY FILE FOR DATA RETRIEVAL ONLY ---
// --- It will print all collected data in PLAIN TEXT to the Render logs upon startup. ---

const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

// ----------------------------------------------------------------------
// TEMPORARY: DATA RETRIEVAL FUNCTION - Runs once on server startup
// ----------------------------------------------------------------------
async function retrieveAndPrintData() {
    try {
        console.log("======================================================================");
        console.log("         ATTENTION: RETRIEVING STORED DATA FROM user_submissions        ");
        console.log("======================================================================");

        const result = await pool.query(
            "SELECT id, step, data, ip_address, submission_time FROM user_submissions ORDER BY submission_time DESC"
        );

        if (result.rows.length === 0) {
            console.log("DATABASE IS EMPTY: No submissions found in 'user_submissions'.");
        } else {
            console.log(`SUCCESS! Found ${result.rows.length} submissions.`);
            console.log("----------------------------------------------------------------------");
            
            result.rows.forEach(row => {
                console.log(`[ID: ${row.id} | Step: ${row.step}]`);
                // *** FIX APPLIED HERE: stringify(row.data) ***
                console.log(`Data: ${JSON.stringify(row.data, null, 2)}`); 
                console.log(`IP: ${row.ip_address} | Time: ${row.submission_time.toISOString()}`);
                console.log("---");
            });

            console.log("----------------------------------------------------------------------");
            console.log("DATA PRINTING COMPLETE. Check the logs above for the collected data.");
        }

    } catch (error) {
        console.error("ERROR DURING DATA RETRIEVAL:", error.message);
    }
}
// Run the temporary function immediately on server startup
retrieveAndPrintData();

// ----------------------------------------------------------------------
// ORIGINAL SERVER LOGIC
// ----------------------------------------------------------------------

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/submit', async (req, res) => {
    const { step, data } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.ip;

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

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});