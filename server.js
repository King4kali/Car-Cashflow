const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// Порт по умолчанию или порт из переменной окружения
const port = process.env.PORT || 3000;

// Создание экземпляра бота
const token = '7423830672:AAGij0DcWzNdNyu8DGHZ3mbuWNKB0QUOr0U';
const bot = new TelegramBot(token, { polling: true });

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

// Обработка команд от Telegram-бота
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Отправьте /score, чтобы получить свой текущий счет, или /add <число>, чтобы добавить очки.');
});

bot.onText(/\/score/, (msg) => {
    const chatId = msg.chat.id;
    db.get('SELECT score FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            bot.sendMessage(chatId, 'Произошла ошибка при получении счета.');
        } else {
            const score = row ? row.score : 0;
            bot.sendMessage(chatId, `Ваш текущий счет: ${score}`);
        }
    });
});

bot.onText(/\/add (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const increment = parseInt(match[1], 10);

    db.get('SELECT score FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            bot.sendMessage(chatId, 'Произошла ошибка при получении счета.');
        } else {
            const newScore = (row ? row.score : 0) + increment;
            db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [chatId, newScore], function (err) {
                if (err) {
                    bot.sendMessage(chatId, 'Произошла ошибка при обновлении счета.');
                } else {
                    bot.sendMessage(chatId, `Ваш новый счет: ${newScore}`);
                }
            });
        }
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
