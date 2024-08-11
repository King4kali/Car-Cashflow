const express = require('express');
const fetch = require('node-fetch'); // Убедитесь, что это установлено через npm
const app = express();

const TELEGRAM_BOT_TOKEN = '7423830672:AAFneo5E9lPGO7t6-91QMEyxe9XTTdu1ia8';
let CHAT_ID = ''; // Изначально пусто

app.use(express.json());

// Функция для получения chat_id
async function fetchChatId() {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.result.length > 0) {
            // Получаем последний chat_id из списка обновлений
            CHAT_ID = data.result[data.result.length - 1].message.chat.id;
            console.log(`Получен chat_id: ${CHAT_ID}`);
        } else {
            console.error('Нет обновлений для получения chat_id');
        }
    } catch (error) {
        console.error('Ошибка при получении chat_id:', error);
    }
}

// Запускаем функцию для получения chat_id
fetchChatId().then(() => {
    app.post('/save-score', (req, res) => {
        const { score } = req.body;

        // Логика сохранения счёта...

        // Уведомление через Telegram бот
        if (CHAT_ID) {
            notifyTelegram(`Новый счёт: ${score}`);
            res.json({ message: 'Счёт сохранён' });
        } else {
            res.status(500).json({ message: 'Ошибка: chat_id не определён' });
        }
    });

    function notifyTelegram(message) {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const body = {
            chat_id: CHAT_ID,
            text: message
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => console.log('Сообщение отправлено в Telegram:', data))
        .catch(error => console.error('Ошибка при отправке сообщения в Telegram:', error));
    }

    app.listen(3000, () => {
        console.log('Сервер работает на порту 3000');
    });
});
