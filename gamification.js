// 1. Variáveis Globais (Essenciais para o motor do jogo)
let canvas, ctx;
let score = 0, startTime, targetTimer, gameDuration, targetInterval;
let gameRunning = false;
let target = { x: 0, y: 0, r: 25, color: "" };

const colors = {
    red: { name: "Vermelho", hex: "#ff4444" },
    blue: { name: "Azul", hex: "#4444ff" },
    green: { name: "Verde", hex: "#44ff44" }
};

// 2. Inicialização (Quando o browser carrega o HTML)
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Escuta de cliques no alvo
    canvas.addEventListener('mousedown', function(e) {
        if (!gameRunning) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dist = Math.sqrt((mouseX - target.x)**2 + (mouseY - target.y)**2);
        if (dist < target.r) {
            score++;
            newTarget(); // Gera novo alvo imediatamente ao acertar
        }
    });
};

// 3. Funções Globais (Chamadas pelos botões do HTML)
window.startGame = function(diff) {
    const configs = {
        easy:   { time: 40, interval: 1200, radius: 35 },
        medium: { time: 30, interval: 900,  radius: 25 },
        hard:   { time: 20, interval: 600,  radius: 15 }
    };

    const conf = configs[diff];
    score = 0;
    gameDuration = conf.time;
    targetInterval = conf.interval;
    target.r = conf.radius;
    gameRunning = true;
    startTime = Date.now();

    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    newTarget();
    update(); // Inicia o loop
};

window.showInstructions = function() {
    document.getElementById('error-msg').style.display = 'block';
};

// 4. A tua lógica de cores e alvos (Melhorada)
function newTarget() {
    const keys = Object.keys(colors);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    target.color = colors[randomKey].hex;
    const instructionColorName = colors[randomKey].name;

    // Atualiza o HUD
    document.getElementById('instruction-text').innerText = `TOCA NO ${instructionColorName.toUpperCase()}`;
    document.getElementById('instruction-text').style.color = target.color;
    document.getElementById('score').innerText = score;
    
    // Posicionamento
    target.x = Math.random() * (canvas.width - 100) + 50;
    target.y = Math.random() * (canvas.height - 150) + 120;
    targetTimer = Date.now();
}

// 5. Motor de Atualização e Desenho
function update() {
    if (!gameRunning) return;

    let now = Date.now();
    let elapsed = (now - startTime) / 1000;
    let remaining = Math.max(0, Math.ceil(gameDuration - elapsed));

    document.getElementById('timer').innerText = remaining;

    if (remaining <= 0) {
        endGame();
        return;
    }

    if (now - targetTimer > targetInterval) {
        newTarget(); // Muda de alvo se o tempo expirar
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
    ctx.fillStyle = target.color;
    ctx.fill();
    ctx.closePath();
}

function endGame() {
    gameRunning = false;
    alert("Fim! Pontuação: " + score);
    document.getElementById('menu').style.display = 'block';
    document.getElementById('hud').style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}