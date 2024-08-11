const $circle = document.querySelector('#circle');
const $score = document.querySelector('#score');

let score = 0;

function start() {
    fetch(`/get-score`)
        .then(response => response.json())
        .then(data => {
            setScore(data.score);
            updateImage();
        })
        .catch(error => console.error('Error fetching score:', error));
}

function setScore(newScore) {
    score = newScore;
    $score.textContent = score;
    updateImage();
}

function updateImage() {
    if (score >= 50) {
        $circle.setAttribute('src', 'img/Designere46.jpeg');
    }
}

function incrementScore() {
    setScore(score + 1);
    saveScore(score);
}

function saveScore(score) {
    fetch('/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score })
    })
    .then(response => response.json())
    .catch(error => console.error('Error saving score:', error));
}

$circle.addEventListener('click', (event) => {
    const rect = $circle.getBoundingClientRect();
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
    plusOne.style.left = `${event.clientX - rect.left}px`;
    plusOne.style.top = `${event.clientY - rect.top}px`;

    $circle.parentElement.appendChild(plusOne);

    setTimeout(() => {
        plusOne.classList.add('animate');
    }, 0);

    incrementScore();

    setTimeout(() => {
        plusOne.remove();
    }, 2000);
});

start();
