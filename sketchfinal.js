let video, handPose, hands = [];
let circles = [], correct = 0, wrong = 0, timeLeft = 0;
let gameActive = false, gameTimer = null, lastChange = 0, targetColor = null;

// Configuração controlada pelo Switch
let cfg = { hitDist: 40, interval: 3000, holdRequired: false, hasObstacles: false };

const palette = [
    { name: 'VERDE', rgb: [0, 200, 0] },
    { name: 'VERMELHO', rgb: [220, 0, 0] },
    { name: 'AZUL', rgb: [0, 100, 255] },
    { name: 'AMARELO', rgb: [255, 220, 0] }
];

function preload() {
    handPose = ml5.handPose({ flipped: true });
}

function setup() {
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container');
    
    video = createCapture(VIDEO, { flipped: true }, () => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('menu').style.display = 'flex';
    });
    video.size(640, 480);
    video.hide();
    handPose.detectStart(video, (res) => hands = res);
}

function draw() {
    clear();
    image(video, 0, 0);

    if (!gameActive) return;

    if (millis() - lastChange > cfg.interval) generateCircles();

    // Desenhar Círculos (Sólidos, sem transparência opaca)
    circles.forEach(c => {
        fill(c.rgb[0], c.rgb[1], c.rgb[2]);
        noStroke();
        circle(c.x, c.y, 60);

        if (cfg.holdRequired && c.name === targetColor.name) {
            noFill(); stroke(255); strokeWeight(4);
            arc(c.x, c.y, 72, 72, 0, map(c.hold, 0, 100, 0, TWO_PI));
        }
    });

    // Mapeamento do Dedo (Consistência absoluta em todos os níveis)
    if (hands.length > 0) {
        let finger = hands[0].index_finger_tip;
        fill(255, 0, 255);
        noStroke();
        circle(finger.x, finger.y, 18);
        checkCollisions(finger);
    }
}

function checkCollisions(f) {
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = dist(f.x, f.y, c.x, c.y);

        if (d < cfg.hitDist) {
            if (c.isBlack) {
                wrong++; circles.splice(i, 1);
            } else if (c.name === targetColor.name) {
                if (cfg.holdRequired) {
                    c.hold += 4;
                    if (c.hold >= 100) { correct++; circles.splice(i, 1); pickNewTarget(); }
                } else {
                    correct++; circles.splice(i, 1); pickNewTarget();
                }
            } else {
                wrong++; circles.splice(i, 1);
            }
            updateHUD();
        }
    }
}

window.startGame = function(level) {
    correct = 0; wrong = 0;
    gameActive = true;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // SWITCH CASE - Definição de regras
    switch(level) {
        case 'easy':
            cfg = { hitDist: 45, interval: 4000, holdRequired: false, hasObstacles: false, time: 30 };
            break;
        case 'medium':
            cfg = { hitDist: 20, interval: 2500, holdRequired: true, hasObstacles: false, time: 30 };
            break;
        case 'hard':
            cfg = { hitDist: 10, interval: 1500, holdRequired: false, hasObstacles: true, time: 25 };
            break;
    }

    timeLeft = cfg.time;
    generateCircles();
    updateHUD();

    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
};

function generateCircles() {
    circles = [];
    let margin = 70;
    // Garante 4 círculos com distância mínima entre eles
    for (let i = 0; i < 4; i++) {
        let p = palette[i];
        let x, y, tooClose;
        let attempts = 0;
        do {
            tooClose = false;
            x = random(margin, width - margin);
            y = random(margin + 50, height - margin);
            for (let other of circles) {
                if (dist(x, y, other.x, other.y) < 130) tooClose = true;
            }
            attempts++;
        } while (tooClose && attempts < 50);
        circles.push({ x, y, rgb: p.rgb, name: p.name, hold: 0, isBlack: false });
    }

    if (cfg.hasObstacles) {
        circles.push({ x: random(80, 560), y: random(120, 400), rgb: [0,0,0], name: 'PRETO', isBlack: true });
    }
    pickNewTarget();
    lastChange = millis();
}

function pickNewTarget() {
    let choices = circles.filter(c => !c.isBlack);
    if (choices.length > 0) {
        targetColor = random(choices);
        let el = document.getElementById('target-name');
        el.innerText = targetColor.name;
        el.style.color = `rgb(${targetColor.rgb[0]},${targetColor.rgb[1]},${targetColor.rgb[2]})`;
    }
}

function updateHUD() {
    document.getElementById('correct-count').innerText = correct;
    document.getElementById('wrong-count').innerText = wrong;
}

function endGame() {
    gameActive = false;
    clearInterval(gameTimer);
    document.getElementById('hud').style.display = 'none';
    document.getElementById('results-screen').style.display = 'flex';
    document.getElementById('final-correct').innerText = correct;
    document.getElementById('final-wrong').innerText = wrong;
}

window.backToMenu = function() {
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
};