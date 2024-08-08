const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const port = 3000;

// Ваш токен Telegram бота
const token = '7423830672:AAGij0DcWzNdNyu8DGHZ3mbuWNKB0QUOr0U';

// Создание экземпляра бота
const bot = new TelegramBot(token, { polling: true });

// Создание базы данных и таблицы
const db = new sqlite3.Database('scores.db');
db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score INTEGER)');

app.use(express.json()); // Использование встроенного middleware express.json()
app.use(express.static(path.join(__dirname, 'public')));

// Обработка команды /save-score
bot.onText(/\/save-score (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const id = parseInt(match[1], 10);
    const score = parseInt(match[2], 10);
    
    if (isNaN(id) || isNaN(score)) {
        bot.sendMessage(chatId, 'Некорректные данные. Используйте формат: /save-score ID SCORE');
        return;
    }

    db.run('INSERT INTO scores (id, score) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET score = excluded.score', [id, score], function (err) {
        if (err) {
            bot.sendMessage(chatId, `Ошибка при сохранении данных: ${err.message}`);
        } else {
            bot.sendMessage(chatId, `Оценка ${score} успешно сохранена для ID ${id}`);
        }
    });
});

// Обработка команды /get-score
bot.onText(/\/get-score (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const id = parseInt(match[1], 10);
    
    if (isNaN(id)) {
        bot.sendMessage(chatId, 'Некорректный ID. Используйте формат: /get-score ID');
        return;
    }

    db.get('SELECT score FROM scores WHERE id = ?', [id], (err, row) => {
        if (err) {
            bot.sendMessage(chatId, `Ошибка при получении данных: ${err.message}`);
        } else {
            bot.sendMessage(chatId, `Оценка для ID ${id} составляет: ${row ? row.score : 0}`);
        }
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
