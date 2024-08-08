const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

const db = new sqlite3.Database('scores.db');

// Create table if it doesn't exist
db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score INTEGER)');

app.use(express.json()); // Use built-in express.json() middleware
app.use(express.static(path.join(__dirname, 'public')));

// Route to save or update score
app.post('/save-score', (req, res) => {
    const { id, score } = req.body; // Destructure id and score from req.body
    if (typeof id !== 'number' || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }
    db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [id, score], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ id: id });
    });
});

// Route to get score by ID
app.get('/get-score/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    db.get('SELECT score FROM scores WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ score: row ? row.score : 0 });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
