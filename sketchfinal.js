let video, handPose, hands = [];
let circles = [], correct = 0, wrong = 0, timeLeft = 0;
let gameActive = false, isPaused = false, gameTimer = null, lastChange = 0, targetColor = null;

// Configurações do Switch
let cfg = { size: 60, hitDist: 35, interval: 3000, hold: false, black: false };

const palette = [
    { name: 'VERDE', rgb: [0, 200, 0] },
    { name: 'VERMELHO', rgb: [220, 0, 0] },
    { name: 'AZUL', rgb: [0, 100, 255] },
    { name: 'AMARELO', rgb: [255, 220, 0] }
];

function preload() { handPose = ml5.handPose({ flipped: true }); }

function setup() {
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container');
    video = createCapture(VIDEO, { flipped: true }, () => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('menu').style.display = 'flex';
    });
    video.size(640, 480); video.hide();
    handPose.detectStart(video, (res) => hands = res);
}

function draw() {
    clear(); 
    image(video, 0, 0);

    if (!gameActive || isPaused) return;

    if (millis() - lastChange > cfg.interval) generateCircles();

    // Desenhar Círculos
    circles.forEach(c => {
        fill(c.rgb);
        noStroke();
        circle(c.x, c.y, c.size);
        if (cfg.hold && c.name === targetColor.name) {
            noFill(); stroke(255); strokeWeight(3);
            arc(c.x, c.y, c.size+10, c.size+10, 0, map(c.hold, 0, 100, 0, TWO_PI));
        }
    });

    // Rastro do Dedo (Fixo e Estável)
    if (hands.length > 0) {
        let f = hands[0].index_finger_tip;
        fill(255, 0, 255); circle(f.x, f.y, 15);
        checkCollisions(f);
    }
}

function checkCollisions(f) {
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = dist(f.x, f.y, c.x, c.y);

        if (d < (c.size/2 + cfg.hitDist)) {
            if (c.isBlack) {
                wrong++; circles.splice(i, 1);
            } else if (c.name === targetColor.name) {
                if (cfg.hold) {
                    c.hold += 5;
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
    correct = 0; wrong = 0; gameActive = true; isPaused = false;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('results-screen').style.display = 'none';

    switch(level) {
        case 'easy':
            cfg = { size: 70, hitDist: 20, interval: 4000, hold: false, black: false, time: 30 };
            break;
        case 'medium':
            // Circulos menores (55), mais rápido (2.2s), precisa segurar
            cfg = { size: 55, hitDist: 10, interval: 2200, hold: true, black: false, time: 30 };
            break;
        case 'hard':
            // Circulos pequenos (40), muito rápido (1.5s), precisão centro, bolas pretas
            cfg = { size: 40, hitDist: 5, interval: 1500, hold: false, black: true, time: 25 };
            break;
    }
    timeLeft = cfg.time;
    generateCircles();
    updateHUD();
    startTimer();
};

function generateCircles() {
    circles = [];
    let margin = 80;
    for (let i = 0; i < 4; i++) {
        let pos = getSafePos();
        circles.push({ x: pos.x, y: pos.y, rgb: palette[i].rgb, name: palette[i].name, size: cfg.size, hold: 0, isBlack: false });
    }
    if (cfg.black) {
        let pos = getSafePos();
        circles.push({ x: pos.x, y: pos.y, rgb: [0,0,0], name: 'PRETO', size: cfg.size, isBlack: true });
    }
    pickNewTarget();
    lastChange = millis();
}

function getSafePos() {
    let x, y, tooClose;
    let margin = 60;
    do {
        tooClose = false;
        x = random(margin, width - margin);
        y = random(margin + 60, height - margin);
        for (let c of circles) {
            if (dist(x, y, c.x, c.y) < 110) tooClose = true;
        }
    } while (tooClose);
    return {x, y};
}

function pickNewTarget() {
    let options = circles.filter(c => !c.isBlack);
    if (options.length > 0) {
        targetColor = random(options);
        let el = document.getElementById('target-name');
        el.innerText = targetColor.name;
        el.style.color = `rgb(${targetColor.rgb[0]},${targetColor.rgb[1]},${targetColor.rgb[2]})`;
    }
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            document.getElementById('timer').innerText = timeLeft;
            if (timeLeft <= 0) endGame();
        }
    }, 1000);
}

window.togglePause = function() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? "CONTINUAR" : "PAUSA";
};

window.backToMenu = function() {
    gameActive = false; isPaused = false;
    clearInterval(gameTimer);
    document.getElementById('hud').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
};

function updateHUD() {
    document.getElementById('correct-count').innerText = correct;
    document.getElementById('wrong-count').innerText = wrong;
}

function endGame() {
    gameActive = false; clearInterval(gameTimer);
    document.getElementById('hud').style.display = 'none';
    document.getElementById('results-screen').style.display = 'flex';
    document.getElementById('final-correct').innerText = correct;
    document.getElementById('final-wrong').innerText = wrong;
}