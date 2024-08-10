const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');  // Используем для генерации уникального ID

// Порт по умолчанию
const port = process.env.PORT || 3000;

// Создание экземпляра приложения
const app = express();

// Подключение к базе данных
const db = new sqlite3.Database('./scores.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Создание таблицы, если она не существует
db.run('CREATE TABLE IF NOT EXISTS scores (id TEXT PRIMARY KEY, score INTEGER)', (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    }
});

// Middleware для обработки JSON
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Генерация уникального playerId
function generatePlayerId() {
    return crypto.randomBytes(16).toString('hex');
}

// Маршрут для получения playerId
app.get('/get-player-id', (req, res) => {
    const playerId = generatePlayerId();  // Генерация нового playerId
    res.json({ id: playerId });
});

// Маршрут для сохранения счета
app.post('/save-score', (req, res) => {
    const { id, score } = req.body;
    if (!id || score === undefined) {
        return res.status(400).send('Invalid request');
    }

    db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [id, score], function (err) {
        if (err) {
            console.error('Error saving score:', err.message);
            res.status(500).send('Error saving score');
        } else {
            res.json({ id, score });
        }
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
