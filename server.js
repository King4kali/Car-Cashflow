const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');  // Для генерации уникального ID

const app = express();
const port = process.env.PORT || 3000;

// Создание экземпляра бота
const token = '7423830672:AAFneo5E9lPGO7t6-91QMEyxe9XTTdu1ia8'; // Замените на ваш токен
const bot = new TelegramBot(token, { polling: true });

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

// Регистрация пользователя в базе данных
function registerUser(chatId) {
    db.get('SELECT id FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            console.error('Error checking user:', err.message);
            return;
        }
        if (!row) {
            // Пользователь не зарегистрирован, добавляем его
            db.run('INSERT INTO scores (id, score) VALUES (?, ?)', [chatId, 0], (err) => {
                if (err) {
                    console.error('Error registering user:', err.message);
                } else {
                    console.log(`User ${chatId} registered.`);
                }
            });
        }
    });
}

// Обработка команды /start от Telegram бота
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    registerUser(chatId); // Регистрация пользователя
    const siteUrl = 'https://car-cashflow.vercel.app/'; // Замените на URL вашего сайта
    bot.sendMessage(chatId, `Привет! Перейдите по следующему [ссылке](${siteUrl}?chatId=${chatId}), чтобы начать играть и сохранить свой счет.`);
});

// Обработка команды /score
bot.onText(/\/score/, (msg) => {
    const chatId = msg.chat.id;
    registerUser(chatId); // Регистрация пользователя
    db.get('SELECT score FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            console.error('Error fetching score:', err.message);
            bot.sendMessage(chatId, 'Произошла ошибка при получении счета.');
        } else {
            const score = row ? row.score : 0;
            bot.sendMessage(chatId, `Ваш текущий счет: ${score}`);
        }
    });
});

// Обработка команды /add <число>
bot.onText(/\/add (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const increment = parseInt(match[1], 10);
    console.log(`Received /add command from ${chatId} with increment ${increment}`);

    registerUser(chatId); // Регистрация пользователя

    db.get('SELECT score FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            console.error('Error fetching score:', err.message);
            bot.sendMessage(chatId, 'Произошла ошибка при получении счета.');
        } else {
            const newScore = (row ? row.score : 0) + increment;
            console.log(`Updating score for ${chatId} to ${newScore}`);
            db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [chatId, newScore], function (err) {
                if (err) {
                    console.error('Error updating score:', err.message);
                    bot.sendMessage(chatId, 'Произошла ошибка при обновлении счета.');
                } else {
                    bot.sendMessage(chatId, `Ваш новый счет: ${newScore}`);
                }
            });
        }
    });
});

// Сохранение счета
app.post('/save-score', (req, res) => {
    const { id, score } = req.body;
    if (id && score !== undefined) {
        db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [id, score], function (err) {
            if (err) {
                console.error('Error saving score:', err.message);
                res.status(500).json({ error: 'Error saving score' });
            } else {
                res.json({ id, score });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid request data' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
