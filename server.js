const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

// Порт по умолчанию или порт из переменной окружения
const port = process.env.PORT || 3000;
const telegramToken = '7423830672:AAFneo5E9lPGO7t6-91QMEyxe9XTTdu1ia8'; // Замените на ваш токен
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}`;

// Подключение к базе данных
const db = new sqlite3.Database('./scores.db');

// Создание таблиц, если они не существуют
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS users (chat_id INTEGER PRIMARY KEY)');
});

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

// Обработка webhook запросов от Telegram
app.post(`/webhook`, (req, res) => {
    const { message } = req.body;
    if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;

        if (text === '/startr') {
            // Сохранение chat_id в базу данных
            db.run('INSERT OR IGNORE INTO users (chat_id) VALUES (?)', [chatId], function(err) {
                if (err) {
                    console.error('Error saving chat_id:', err);
                } else {
                    // Отправка сообщения в Telegram
                    axios.post(`${telegramApiUrl}/sendMessage`, {
                        chat_id: chatId,
                        text: 'Chat ID saved successfully!'
                    })
                    .catch(error => console.error('Error sending message:', error));
                }
            });
        }
    }
    res.sendStatus(200);
});

// Настройка webhook
app.get('/set-webhook', (req, res) => {
    axios.post(`${telegramApiUrl}/setWebhook`, {
        url: `car-cashflow.vercel.app` // Замените на ваш домен
    })
    .then(response => res.json(response.data))
    .catch(error => {
        console.error('Error setting webhook:', error);
        res.status(500).send('Error setting webhook');
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
