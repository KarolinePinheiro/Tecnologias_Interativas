// Variáveis de Controlo
let score = 0;
let correctHits = 0;
let wrongHits = 0;
let timeLeft = 0;
let gameTimer = null;
let isPaused = false;

// Configurações de Dificuldade
const levels = {
    easy:   { time: 40, name: "FÁCIL" },
    medium: { time: 30, name: "MÉDIO" },
    hard:   { time: 20, name: "DIFÍCIL" }
};

// 1. Iniciar o Jogo
window.startGame = function(level) {
    const config = levels[level];
    
    // Reset de dados
    score = 0;
    correctHits = 0;
    wrongHits = 0;
    timeLeft = config.time;
    isPaused = false;

    // Atualizar UI
    document.getElementById('level-name').innerText = config.name;
    document.getElementById('timer').innerText = timeLeft;
    document.getElementById('score').innerText = score;
    document.getElementById('correct').innerText = correctHits;
    document.getElementById('wrong').innerText = wrongHits;
    document.getElementById('pause-btn').innerText = "PAUSA";

    // Trocar Ecrãs
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    startTimer();
};

// 2. Lógica do Temporizador
function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(gameTimer);
                alert("Tempo Esgotado! Pontos: " + score);
                backToMenu();
            }
        }
    }, 1000);
}

// 3. Botão de Pausa
window.togglePause = function() {
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.innerText = isPaused ? "CONTINUAR" : "PAUSA";
    btn.style.backgroundColor = isPaused ? "#ffcc00" : "#fff";
};

// 4. Voltar ao Menu
window.backToMenu = function() {
    clearInterval(gameTimer);
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
};

// 5. Sair da App
window.exitApp = function() {
    if (confirm("Desejas fechar a aplicação?")) {
        window.close();
    }
};

// 6. Instruções
window.showInstructions = function() {
    const msg = document.getElementById('error-msg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
};