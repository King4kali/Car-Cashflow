const $circle = document.querySelector('#circle');
const $score = document.querySelector('#score');

let playerId = null; // Инициализируем playerId

function start() {
    // Получаем playerId от сервера
    fetch('/user-id/123456789') // Замените 123456789 на реальный ID, который нужно использовать
        .then(response => response.json())
        .then(data => {
            playerId = data.id;
            console.log('Player ID received:', playerId);
            fetchScore(); // После получения ID, загружаем текущий счет
        })
        .catch(error => console.error('Error fetching user ID:', error));
}

function fetchScore() {
    if (playerId) {
        fetch(`/get-score/${playerId}`)
            .then(response => response.json())
            .then(data => {
                setScore(data.score);
                setImage();
            })
            .catch(error => console.error('Error fetching score:', error));
    } else {
        console.error('Player ID is not available.');
    }
}

function setScore(newScore) {
    score = newScore;
    $score.textContent = score;
}

function setImage() {
    if (getScore() >= 50) {
        $circle.setAttribute('src', 'img/Designere46.jpeg');
    }
}

function getScore() {
    return score;
}

function addOne() {
    setScore(getScore() + 1);
    setImage();
    saveScore(score);
}

function saveScore(score) {
    if (playerId) {
        fetch('/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: playerId, score })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => console.log('Score saved for ID:', data.id))
        .catch(error => console.error('Error saving score:', error));
    } else {
        console.error('No player ID available.');
    }
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

    setTimeout(() => {
        plusOne.classList.add('animate');
    }, 0);

    addOne();

    setTimeout(() => {
        plusOne.remove();
    }, 2000);
});

start();
