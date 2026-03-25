let video, handPose, hands = [];
let circles = [], correct = 0, wrong = 0, timeLeft = 0;
let gameActive = false, isPaused = false, gameTimer = null, lastChange = 0, targetColor = null;

// --- SONS ---
let soundCorrect, soundError;

// --- VARIÁVEIS DE MOVIMENTO PROFISSIONAL ---
let cursorX = 0, cursorY = 0;
let lerpFactor = 0.30; // Suavização equilibrada
let deadZone = 2;      // Filtro de tremor

// Configurações do Jogo
let valinit = { size: 60, hitDist: 35, interval: 3000, hold: false, black: false };

const palette = [
    { name: 'VERDE', rgb: [0, 200, 0] },
    { name: 'VERMELHO', rgb: [220, 0, 0] },
    { name: 'AZUL', rgb: [0, 100, 255] },
    { name: 'AMARELO', rgb: [255, 220, 0] }
];

function preload() { 
    // ml5 v1 - HandPose (flipped garante que a coordenada X bate certo com o espelho)
    handPose = ml5.handPose({ flipped: true });
    
    soundCorrect = createAudio('acerto.mp3');
    soundError = createAudio('erro.mp3');
}

function setup() {
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container');
    
    // Captura o vídeo e esconde o loading quando estiver pronto
    video = createCapture(VIDEO, { flipped: true }, () => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('menu').style.display = 'flex';
    });
    
    video.size(640, 480); 
    video.hide();
    
    // Inicia a deteção contínua (Sintaxe ml5 v1)
    handPose.detectStart(video, (res) => {
        hands = res;
    });

    cursorX = width / 2;
    cursorY = height / 2;
}

function draw() {
    // Desenha o vídeo espelhado (ponto fundamental para o paciente se orientar)
    image(video, 0, 0, width, height);

    if (!gameActive || isPaused) return;

    // Gerar alvos periodicamente
    if (millis() - lastChange > valinit.interval) generateCircles();

    // Desenhar Alvos com Estilo Profissional
    circles.forEach(c => {
        drawProfessionalTarget(c);
    });

    // Lógica do Cursor de Mira
    if (hands.length > 0) {
        let finger = hands[0].index_finger_tip;

        // Interpolação Linear (Lerp) para suavizar o lag do modelo
        if (abs(finger.x - cursorX) > deadZone) {
            cursorX = lerp(cursorX, finger.x, lerpFactor);
        }
        if (abs(finger.y - cursorY) > deadZone) {
            cursorY = lerp(cursorY, finger.y, lerpFactor);
        }

        drawProfessionalCursor(cursorX, cursorY);
        checkCollisions({ x: cursorX, y: cursorY });
    }
}

function drawProfessionalTarget(c) {
    push();
    // Efeito visual de profundidade
    fill(0, 60); noStroke();
    circle(c.x + 4, c.y + 4, c.size); 

    fill(c.rgb);
    stroke(255);
    strokeWeight(3);
    circle(c.x, c.y, c.size);

    // Anel de mira interna
    stroke(255, 120);
    noFill();
    circle(c.x, c.y, c.size * 0.55);

    // Feedback de HOLD (Segurar)
    if (valinit.hold && targetColor && c.name === targetColor.name) {
        stroke(255);
        strokeWeight(6);
        noFill();
        // Inicia do topo (-90 graus)
        arc(c.x, c.y, c.size + 15, c.size + 15, -HALF_PI, map(c.hold, 0, 100, 0, TWO_PI) - HALF_PI);
    }
    pop();
}

function drawProfessionalCursor(x, y) {
    push();
    stroke(255, 0, 255); // Mira rosa para contraste máximo sobre qualquer cor
    strokeWeight(2.5);
    noFill();
    circle(x, y, 26); 
    
    // Cruz de precisão
    line(x - 16, y, x + 16, y);
    line(x, y - 16, x, y + 16);
    
    // Centro sólido
    fill(255); noStroke();
    circle(x, y, 6);
    pop();
}

function checkCollisions(pos) {
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = dist(pos.x, pos.y, c.x, c.y);

        if (d < (c.size / 2 + valinit.hitDist)) {
            if (c.isBlack) {
                handleHit(false, i);
            } else if (targetColor && c.name === targetColor.name) {
                if (valinit.hold) {
                    c.hold += 4.5; // Velocidade de carregamento
                    if (c.hold >= 100) handleHit(true, i);
                } else {
                    handleHit(true, i);
                }
            } else {
                handleHit(false, i);
            }
            updateHUD();
        }
    }
}

function handleHit(isCorrect, index) {
    if (isCorrect) {
        correct++;
        soundCorrect.play();
        circles.splice(index, 1);
        pickNewTarget();
    } else {
        wrong++;
        soundError.play();
        circles.splice(index, 1);
    }
}

window.startGame = function(level) {
    correct = 0; wrong = 0; gameActive = true; isPaused = false;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('results-screen').style.display = 'none';

    switch(level) {
        case 'easy':
            valinit = { size: 90, hitDist: 45, interval: 6000, hold: false, black: false, time: 40 };
            break;
        case 'medium':
            valinit = { size: 70, hitDist: 30, interval: 4000, hold: true, black: false, time: 35 };
            break;
        case 'hard':
            valinit = { size: 50, hitDist: 15, interval: 72500, hold: false, black: true, time: 30 };
            break;
    }
    
    timeLeft = valinit.time;
    generateCircles();
    updateHUD();
    startTimer();
};

function generateCircles() {
    circles = [];
    for (let i = 0; i < 4; i++) {
        let pos = getSafePos();
        circles.push({ x: pos.x, y: pos.y, rgb: palette[i].rgb, name: palette[i].name, size: valinit.size, hold: 0, isBlack: false });
    }
    if (valinit.black) {
        let pos = getSafePos();
        circles.push({ x: pos.x, y: pos.y, rgb: [0,0,0], name: 'PRETO', size: valinit.size, isBlack: true });
    }
    pickNewTarget();
    lastChange = millis();
}

function getSafePos() {
    let x, y, tooClose;
    let margin = 90;
    let attempts = 0;
    do {
        tooClose = false;
        x = random(margin, width - margin);
        y = random(margin + 60, height - margin);
        for (let c of circles) {
            if (dist(x, y, c.x, c.y) < 135) tooClose = true;
        }
        attempts++;
    } while (tooClose && attempts < 50);
    return { x, y };
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

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? "CONTINUAR" : "PAUSA";
}

function backToMenu() {
    gameActive = false; isPaused = false;
    clearInterval(gameTimer);
    document.getElementById('hud').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('instructions-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
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

// --- FUNÇÃO DE INSTRUÇÕES (VIA FETCH) ---
function showInstructions() {
    fetch('instructions.txt')
        .then(response => response.text())
        .then(data => {
            document.getElementById('instructions-text').innerText = data;
            document.getElementById('menu').style.display = 'none';
            document.getElementById('instructions-screen').style.display = 'flex';
        })
        .catch(err => {
            console.error('Erro ao ler instructions.txt');
            document.getElementById('instructions-text').innerText = 'Instruções não encontradas.';
            document.getElementById('instructions-screen').style.display = 'flex';
        });
}