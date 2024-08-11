const express = require('express');
const fetch = require('node-fetch'); // Убедитесь, что это установлено через npm
const app = express();

const TELEGRAM_BOT_TOKEN = '7423830672:AAFneo5E9lPGO7t6-91QMEyxe9XTTdu1ia8';
const CHAT_ID = '<ВашChatID>'; // Замените на ваш ID чата или канала

app.use(express.json());

app.post('/save-score', (req, res) => {
    const { score } = req.body;

    // Логика сохранения счёта...

    // Уведомление через Telegram бот
    notifyTelegram(`Новый счёт: ${score}`);

    res.json({ message: 'Счёт сохранён' });
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
