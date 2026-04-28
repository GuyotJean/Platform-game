const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve all static files from the frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- In-memory storage for player names and scores ---
// Note: data resets when the server restarts.
// Swap these arrays for a real database (e.g. SQLite, MongoDB) for persistence.
const players = [];
const scores  = [];

// ── API Routes ──────────────────────────────────────────────────────────────

// POST /api/players  →  Register a player name
app.post('/api/players', (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
    }

    const trimmed = name.trim();
    // Return existing player if the name is already taken (case-insensitive)
    let player = players.find(p => p.name.toLowerCase() === trimmed.toLowerCase());

    if (!player) {
        player = {
            id: players.length + 1,
            name: trimmed,
            createdAt: new Date().toISOString()
        };
        players.push(player);
        console.log(`[players] New player registered: "${trimmed}"`);
    }

    res.status(201).json(player);
});

// GET /api/players  →  List all registered players
app.get('/api/players', (req, res) => {
    res.json(players);
});

// POST /api/scores  →  Save a score entry
app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) {
        return res.status(400).json({ error: 'name and score are required' });
    }

    const entry = {
        id: scores.length + 1,
        name: String(name).trim(),
        score: Number(score),
        playedAt: new Date().toISOString()
    };
    scores.push(entry);
    console.log(`[scores] ${entry.name} scored ${entry.score}`);

    res.status(201).json(entry);
});

// GET /api/scores  →  Return all scores, highest first
app.get('/api/scores', (req, res) => {
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    res.json(sorted);
});

// Catch-all: serve index.html for any unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Neon Gravity server running → http://localhost:${PORT}`);
});
