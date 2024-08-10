const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

// Порт по умолчанию или порт из переменной окружения
const port = process.env.PORT || 3000;

// Создание экземпляра бота
const token = '7423830672:AAFneo5E9lPGO7t6-91QMEyxe9XTTdu1ia8'; // Замените на ваш актуальный токен
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
db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, score INTEGER)', (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    }
});

// Middleware для обработки JSON
const app = express();
app.use(express.json());
app.use(bodyParser.json());

// Обслуживание статических файлов из директории public
app.use(express.static(path.join(__dirname, 'public')));

// Проверка и регистрация пользователя
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

// Обработка команд от Telegram-бота
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    registerUser(chatId); // Регистрация пользователя
    bot.sendMessage(chatId, 'Привет! Отправьте /score, чтобы получить свой текущий счет, или /add <число>, чтобы добавить очки.');
});

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

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
