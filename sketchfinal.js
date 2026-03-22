let video;
let handPose;
let hands = [];
let painting;
let circles = [];
let score = 0;
let timeLeft = 0;
let gameTimer = null;
let gameActive = false;
let currentDifficulty = 'easy';
let lastChange = 0;

// Configuração base (o número de círculos não muda)
let config = {
    numCircles: 4,
    numObstacles: 0,
    precision: 35, // Distância para colidir
    interval: 2000,
    holdRequired: false,
    holdTime: 0
};

function preload() {
    handPose = ml5.handPose({ flipped: true });
}

function setup() {
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container');
    painting = createGraphics(640, 480);
    video = createCapture(VIDEO, { flipped: true });
    video.size(640, 480);
    video.hide();
    handPose.detectStart(video, (results) => { hands = results; });
}

function draw() {
    if (!gameActive) return;
    image(video, 0, 0);

    // Fade do rastro
    painting.background(0, 0, 0, 20);
    image(painting, 0, 0);

    if (millis() - lastChange > config.interval) {
        generateCircles();
    }

    drawLevel();
}

function drawLevel() {
    if (hands.length > 0) {
        let index = hands[0].index_finger_tip;
        if (index) {
            // Desenha rastro
            painting.noStroke();
            painting.fill(255, 0, 255);
            painting.circle(index.x, index.y, 10);

            for (let i = circles.length - 1; i >= 0; i--) {
                let c = circles[i];
                let d = dist(index.x, index.y, c.x, c.y);

                if (c.isObstacle) {
                    // Lógica de Bolas Pretas (Dificuldade Hard)
                    if (d < 30) { 
                        score = max(0, score - 5);
                        document.getElementById('score-val').innerText = score;
                        circles.splice(i, 1); // Remove ao tocar
                    }
                } else {
                    // Lógica de Colisão por Nível
                    if (d < config.precision) {
                        if (config.holdRequired) {
                            // No Médio: Precisa segurar (incrementa progresso)
                            c.holdProgress += 2; 
                            if (c.holdProgress >= 100) {
                                score += 20;
                                circles.splice(i, 1);
                            }
                        } else {
                            // Fácil e Difícil: Toque imediato (mas precisão diferente)
                            score += 10;
                            circles.splice(i, 1);
                        }
                        document.getElementById('score-val').innerText = score;
                    }
                }
            }
        }
    }

    // Desenhar círculos na tela
    for (let c of circles) {
        noStroke();
        fill(c.color);
        circle(c.x, c.y, c.r * 2);
        
        // Feedback visual do "Segurar" no Médio
        if (config.holdRequired && !c.isObstacle) {
            noFill();
            stroke(255);
            arc(c.x, c.y, (c.r+5)*2, (c.r+5)*2, 0, map(c.holdProgress, 0, 100, 0, TWO_PI));
        }
    }
}

window.startGame = function(level) {
    currentDifficulty = level;
    score = 0;
    gameActive = true;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    let inst = document.getElementById('instruction-text');

    switch(level) {
        case 'easy':
            config = { numCircles: 4, numObstacles: 0, precision: 35, interval: 3000, holdRequired: false, time: 40 };
            inst.innerText = "TOCA NAS BOLAS!";
            break;
        case 'medium':
            // Precisão maior (15px do centro), mais rápido, precisa segurar
            config = { numCircles: 4, numObstacles: 0, precision: 15, interval: 2500, holdRequired: true, time: 30 };
            inst.innerText = "SEGURA NO CENTRO!";
            break;
        case 'hard':
            // Precisão total (dentro da bola), muito rápido, bolas pretas negativas
            config = { numCircles: 4, numObstacles: 3, precision: 20, interval: 1500, holdRequired: false, time: 25 };
            inst.innerText = "PRECISÃO TOTAL! EVITA AS PRETAS!";
            break;
    }

    document.getElementById('level-name').innerText = level.toUpperCase();
    document.getElementById('score-val').innerText = score;
    timeLeft = config.time;
    startTimer();
    generateCircles();
};

function generateCircles() {
    circles = [];
    // Bolas Alvo
    for (let i = 0; i < config.numCircles; i++) {
        circles.push({
            x: random(50, width-50), y: random(100, height-50),
            r: 30, color: color(0, 255, 100), 
            isObstacle: false, holdProgress: 0
        });
    }
    // Bolas Pretas (Apenas no Hard)
    for (let i = 0; i < config.numObstacles; i++) {
        circles.push({
            x: random(50, width-50), y: random(100, height-50),
            r: 25, color: color(0, 0, 0), isObstacle: true
        });
    }
    lastChange = millis();
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            alert("Tempo Esgotado! Score: " + score);
            backToMenu();
        }
    }, 1000);
}

window.backToMenu = function() {
    gameActive = false;
    clearInterval(gameTimer);
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
};

window.exitApp = function() { window.location.reload(); };