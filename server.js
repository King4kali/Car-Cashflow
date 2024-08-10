const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Порт по умолчанию или порт из переменной окружения
const port = process.env.PORT || 3000;

// Подключение к базе данных
const db = new sqlite3.Database('./scores.db');

// Создание таблицы, если она не существует
db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score INTEGER)');

// Middleware для обработки JSON
app.use(express.json());

// Обслуживание статических файлов из директории public
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для сохранения или обновления счета
app.post('/save-score', (req, res) => {
    const { id, score } = req.body;
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

// Маршрут для получения счета по ID
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

// Маршрут для корневого URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
