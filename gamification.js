// Variáveis de estado
let score = 0;
let correctHits = 0;
let wrongHits = 0;
let gameTimer;
let timeLeft = 0;

// Configurações de cada nível
const difficultySettings = {
    easy:   { time: 40, label: "FÁCIL" },
    medium: { time: 30, label: "MÉDIO" },
    hard:   { time: 20, label: "DIFÍCIL" }
};

// Tornar as funções globais para o HTML as encontrar no <head>
window.onload = function() {
    console.log("Sistema de Menu pronto.");
};

window.startGame = function(level) {
    const config = difficultySettings[level];
    
    // Reset de valores
    score = 0;
    correctHits = 0;
    wrongHits = 0;
    timeLeft = config.time;

    // Atualizar UI inicial
    document.getElementById('score').innerText = score;
    document.getElementById('correct').innerText = correctHits;
    document.getElementById('wrong').innerText = wrongHits;
    document.getElementById('timer').innerText = timeLeft;
    document.getElementById('level-name').innerText = config.label;

    // Trocar ecrãs
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // Iniciar contagem decrescente
    startCountdown();
};

window.showInstructions = function() {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.style.display = 'block';
    setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
};

function startCountdown() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            alert("Tempo esgotado!");
            backToMenu();
        }
    }, 1000);
}

function backToMenu() {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
}