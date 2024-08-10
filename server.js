const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const port = process.env.PORT || 3000;
const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // Замените на ваш актуальный токен
const bot = new TelegramBot(token, { polling: true });

const db = new sqlite3.Database('./scores.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.run('CREATE TABLE IF NOT EXISTS scores (id TEXT PRIMARY KEY, score INTEGER)', (err) => {
    if (err) {
        console.error('Error creating table:', err.message);
    }
});

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function registerUser(chatId) {
    db.get('SELECT id FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            console.error('Error checking user:', err.message);
            return;
        }
        if (!row) {
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

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    registerUser(chatId);
    bot.sendMessage(chatId, 'Привет! Отправьте /score, чтобы получить свой текущий счет, или /add <число>, чтобы добавить очки.');
});

bot.onText(/\/score/, (msg) => {
    const chatId = msg.chat.id;
    registerUser(chatId);
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
    registerUser(chatId);
    db.get('SELECT score FROM scores WHERE id = ?', [chatId], (err, row) => {
        if (err) {
            console.error('Error fetching score:', err.message);
            bot.sendMessage(chatId, 'Произошла ошибка при получении счета.');
        } else {
            const newScore = (row ? row.score : 0) + increment;
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

app.get('/get-player-id', (req, res) => {
    // Здесь можно использовать реальную логику для получения playerId
    const playerId = 'some_generated_id'; // Замените на реальную логику
    res.json({ id: playerId });
});

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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
