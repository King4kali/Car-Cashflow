const $circle = document.querySelector('#circle');
const $score = document.querySelector('#score');

let score = 0; // Инициализация переменной score
const playerId = 1; // Используем фиксированный ID для простоты

function start() {
    fetch(`/get-score/${playerId}`)
        .then(response => response.json())
        .then(data => {
            setScore(data.score);
            setImage();
        })
        .catch(error => console.error('Error fetching score:', error));
}

function setScore(newScore) {
    score = newScore; // Обновляем переменную score
    $score.textContent = score; // Устанавливаем текстовое содержимое элемента
}

function setImage() {
    if (getScore() >= 50) {
        $circle.setAttribute('src', 'img/Designere46.jpeg'); // Путь к изображению
    }
}

function getScore() {
    return score; // Возвращаем переменную score
}

function addOne() {
    setScore(getScore() + 1);
    setImage();
    saveScore(score); // Сохраняем счет после обновления
}

function saveScore(score) {
    fetch('/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: playerId, score })
    })
    .then(response => response.json())
    .then(data => console.log('Score saved for ID:', data.id))
    .catch(error => console.error('Error saving score:', error));
}

$circle.addEventListener('click', (event) => {
    const rect = $circle.getBoundingClientRect();
    const parentRect = $circle.parentElement.getBoundingClientRect();

    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    const DEG = 40;

    const tiltX = (offsetY / rect.height) * DEG;
    const tiltY = (offsetX / rect.width) * -DEG;

    $circle.style.setProperty('--tiltX', `${tiltX}deg`);
    $circle.style.setProperty('--tiltY', `${tiltY}deg`);

    setTimeout(() => {
        $circle.style.setProperty('--tiltX', `0deg`);
        $circle.style.setProperty('--tiltY', `0deg`);
    }, 300);

    const plusOne = document.createElement('div');
    plusOne.classList.add('plus-one');
    plusOne.textContent = '+1';
    plusOne.style.position = 'absolute';
    plusOne.style.left = `${event.clientX - parentRect.left}px`;
    plusOne.style.top = `${event.clientY - parentRect.top}px`;

    $circle.parentElement.appendChild(plusOne);

    // Запуск анимации
    setTimeout(() => {
        plusOne.classList.add('animate');
    }, 0);

    addOne();

    setTimeout(() => {
        plusOne.remove();
    }, 2000);
});

start();
