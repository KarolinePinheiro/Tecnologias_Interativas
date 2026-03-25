let video, handPose, hands = [];
let circles = [], correct = 0, wrong = 0, timeLeft = 0;
let gameActive = false, isPaused = false, gameTimer = null, lastChange = 0, targetColor = null;

// --- SONS DO JOGO ---
let soundCorrect, soundError;

// --- NOVAS VARIÁVEIS PARA SUAVIZAÇÃO (LERP) ---
let smoothedX = 0;
let smoothedY = 0;
let lerpFactor = 0.25; // Entre 0 e 1. Quanto menor, mais suave/lento é o movimento.

// Configurações do Jogo
let valinit = { size: 60, hitDist: 35, interval: 3000, hold: false, black: false };

const palette = [
    { name: 'VERDE', rgb: [0, 200, 0] },
    { name: 'VERMELHO', rgb: [220, 0, 0] },
    { name: 'AZUL', rgb: [0, 100, 255] },
    { name: 'AMARELO', rgb: [255, 220, 0] }
];

function preload() { 
    handPose = ml5.handPose({ flipped: true });
    soundCorrect = createAudio('acerto.mp3');
    soundError = createAudio('erro.mp3');
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

    // Inicializar posição suavizada no centro
    smoothedX = width / 2;
    smoothedY = height / 2;
}

function draw() {
    clear(); 
    image(video, 0, 0);

    if (!gameActive || isPaused) return;

    if (millis() - lastChange > valinit.interval) generateCircles();

    // Desenhar Círculos (Alvos)
    circles.forEach(c => {
        fill(c.rgb);
        stroke(255); // borda branca para boa leitura em qualquer fundo
        strokeWeight(3);
        circle(c.x, c.y, c.size);
        
        if (valinit.hold && c.name === targetColor.name) {
            noFill(); 
            stroke(255); 
            strokeWeight(4);
            // Desenha o progresso do "Hold" em volta do círculo
            arc(c.x, c.y, c.size + 15, c.size + 15, 0, map(c.hold, 0, 100, 0, TWO_PI));
        }
    });

    // Lógica do Cursor com Filtro de Suavização (Lerp)
    if (hands.length > 0) {
        let finger = hands[0].index_finger_tip;

        // A posição suavizada "persegue" a posição real detetada pela IA
        smoothedX = lerp(smoothedX, finger.x, lerpFactor);
        smoothedY = lerp(smoothedY, finger.y, lerpFactor);

        // Desenhar Cursor Visual (Rosa com borda branca para melhor visibilidade)
        stroke(255);
        strokeWeight(2);
        fill(255, 0, 255); 
        circle(smoothedX, smoothedY, 20);
        
        // Verificar colisões usando a posição suavizada
        checkCollisions({ x: smoothedX, y: smoothedY });
    }
}

function checkCollisions(pos) {
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = dist(pos.x, pos.y, c.x, c.y);

        // Ajuste: A colisão considera o raio do círculo + a distância de tolerância (valinit.hitDist)
        if (d < (c.size / 2 + valinit.hitDist)) {
            if (c.isBlack) {
                wrong++;
                soundError.play();
                circles.splice(i, 1);
            } else if (c.name === targetColor.name) {
                if (valinit.hold) {
                    c.hold += 4; // Velocidade do preenchimento ao segurar
                    if (c.hold >= 100) { 
                        correct++;
                        soundCorrect.play();
                        circles.splice(i, 1); 
                        pickNewTarget(); 
                    }
                } else {
                    correct++;
                    soundCorrect.play();
                    circles.splice(i, 1); 
                    pickNewTarget();
                }
            } else {
                // Tocou na cor errada
                wrong++;
                soundError.play();
                circles.splice(i, 1);
            }
            updateHUD();
        }
    }
}

window.startGame = function(level) {
    correct = 0; 
    wrong = 0; 
    gameActive = true; 
    isPaused = false;
    
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('results-screen').style.display = 'none';

    // Ajuste de dificuldade focado em reabilitação (hitDist mais generoso) e tempo de reação
    switch(level) {
        case 'easy':
            valinit = { size: 85, hitDist: 35, interval: 1200, hold: false, black: false, time: 40 };
            break;
        case 'medium':
            valinit = { size: 65, hitDist: 20, interval: 900, hold: true, black: false, time: 30 };
            break;
        case 'hard':
            valinit = { size: 45, hitDist: 10, interval: 600, hold: false, black: true, time: 20 };
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
        circles.push({ 
            x: pos.x, y: pos.y, 
            rgb: palette[i].rgb, 
            name: palette[i].name, 
            size: valinit.size, 
            hold: 0, 
            isBlack: false 
        });
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
    let margin = 70;
    let attempts = 0;
    do {
        tooClose = false;
        x = random(margin, width - margin);
        y = random(margin + 60, height - margin);
        for (let c of circles) {
            if (dist(x, y, c.x, c.y) < 120) tooClose = true;
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
    gameActive = false;
    isPaused = false;
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

// --- FUNÇÕES DE INSTRUÇÕES ---
function showInstructions() {
    fetch('instructions.txt')
        .then(response => response.text())
        .then(data => {
            document.getElementById('instructions-text').innerText = data;
            document.getElementById('instructions-screen').style.display = 'flex';
        })
        .catch(error => {
            console.error('Erro ao carregar instruções:', error);
            document.getElementById('instructions-text').innerText = 'Erro ao carregar as instruções.';
            document.getElementById('instructions-screen').style.display = 'flex';
        });
}

function closeInstructions() {
    document.getElementById('instructions-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}