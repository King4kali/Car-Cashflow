const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

// Порт по умолчанию или порт из переменной окружения
const port = process.env.PORT || 3000;

// Подключение к базе данных
const db = new sqlite3.Database('./scores.db');

// Создание таблицы, если она не существует
db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score INTEGER)');

// Middleware для обработки JSON
const app = express();
app.use(express.json());
app.use(bodyParser.json());

// Обслуживание статических файлов из директории public
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для сохранения или обновления счета
app.post('/save-score', (req, res) => {
    const { score } = req.body;
    if (typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    // Упрощаем обновление счета для одного общего пользователя
    db.get('SELECT id FROM scores LIMIT 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const id = row ? row.id : 1; // Используем 1 если нет записи

        db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [id, score], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Score saved' });
        });
    });
});

// Маршрут для получения счета
app.get('/get-score', (req, res) => {
    db.get('SELECT score FROM scores LIMIT 1', (err, row) => {
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
