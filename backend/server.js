const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve all static files from the frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────────────────────────

// POST /api/players  →  Register a player name
app.post('/api/players', async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
    }

    const trimmed = name.trim();

    try {
        // Insert or ignore if the name already exists (UNIQUE constraint)
        await pool.execute(
            'INSERT IGNORE INTO players (name) VALUES (?)',
            [trimmed]
        );

        // Retrieve the player row
        const [rows] = await pool.execute(
            'SELECT * FROM players WHERE name = ?',
            [trimmed]
        );

        console.log(`[players] Registered / found: "${trimmed}"`);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[players] Error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/players  →  List all registered players
app.get('/api/players', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM players ORDER BY id');
        res.json(rows);
    } catch (err) {
        console.error('[players] Error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/scores  →  Save a score entry, keep only top 10
app.post('/api/scores', async (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) {
        return res.status(400).json({ error: 'name and score are required' });
    }

    const playerName = String(name).trim();
    const playerScore = Number(score);

    try {
        // Check if this score is high enough to enter the top 10
        const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM scores');
        const total = countRows[0].total;

        if (total >= 10) {
            // Find the lowest score in the current top 10
            const [minRows] = await pool.execute(
                'SELECT MIN(score) AS min_score FROM scores'
            );
            const minScore = minRows[0].min_score;

            // If the new score isn't higher than the current lowest, don't insert
            if (playerScore <= minScore) {
                console.log(`[scores] ${playerName} scored ${playerScore} — not in top 10`);
                return res.status(200).json({
                    message: 'Score not high enough for top 10',
                    score: playerScore
                });
            }
        }

        // Insert the new score
        const [result] = await pool.execute(
            'INSERT INTO scores (name, score) VALUES (?, ?)',
            [playerName, playerScore]
        );

        const entry = {
            id: result.insertId,
            name: playerName,
            score: playerScore
        };

        console.log(`[scores] ${playerName} scored ${playerScore}`);

        // Prune: keep only the top 10 scores
        await pool.execute(`
            DELETE FROM scores
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM scores ORDER BY score DESC LIMIT 10
                ) AS top
            )
        `);

        res.status(201).json(entry);
    } catch (err) {
        console.error('[scores] Error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/scores  →  Return the top 10 scores, highest first
app.get('/api/scores', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM scores ORDER BY score DESC LIMIT 10'
        );
        res.json(rows);
    } catch (err) {
        console.error('[scores] Error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Catch-all: serve index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    try {
        // Test the database connection on startup
        await pool.execute('SELECT 1');
        console.log('✓ Connected to MySQL database');
    } catch (err) {
        console.error('✗ MySQL connection failed:', err.message);
    }
    console.log(`Neon Gravity server running → http://localhost:${PORT}`);
});
