/**
 * VIGOR GEST - Treino Cognitivo e Motor com IA
 * Variáveis Globais de Controlo
 */
let video, handPose, hands = []; // Objetos da câmara e modelo de IA ml5
let circles = [], correct = 0, wrong = 0, timeLeft = 0; // Estado do jogo e pontuação
let gameActive = false, isPaused = false, gameTimer = null, lastChange = 0, targetColor = null;

// --- SONS ---
let soundCorrect, soundError;

// --- VARIÁVEIS DE MOVIMENTO PROFISSIONAL ---
let cursorX = 0, cursorY = 0;
let lerpFactor = 0.30; // Suaviza o movimento (0.0 a 1.0). Quanto menor, mais "lento" o cursor segue o dedo.
let deadZone = 2;      // Ignora micro-movimentos menores que 2 pixéis para evitar tremores.

// Configurações dinâmicas conforme a dificuldade escolhida
let valinit = { size: 60, hitDist: 35, interval: 3000, hold: false, black: false };

// Definição das cores possíveis para os alvos
const palette = [
    { name: 'VERDE', rgb: [0, 200, 0] },
    { name: 'VERMELHO', rgb: [220, 0, 0] },
    { name: 'AZUL', rgb: [0, 100, 255] },
    { name: 'AMARELO', rgb: [255, 220, 0] }
];

/**
 * Carrega os modelos de IA e ficheiros de áudio antes do jogo iniciar
 */
function preload() { 
    // ml5.handPose deteta 21 pontos da mão. flipped:true espelha os dados internos.
    handPose = ml5.handPose({ flipped: true });
    soundCorrect = createAudio('acerto.mp3');
    soundError = createAudio('erro.mp3');
}

/**
 * Configuração inicial do Canvas e Captura de Vídeo
 */
function setup() {
    let canvas = createCanvas(640, 480);
    canvas.parent('game-container'); // Encaixa o jogo na <div> correta do HTML
    
    // Captura vídeo e mostra o menu apenas quando a câmara estiver pronta
    video = createCapture(VIDEO, { flipped: true }, () => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('menu').style.display = 'flex';
    });
    
    video.size(640, 480); 
    video.hide(); // Esconde o elemento original do vídeo para desenharmos no Canvas
    
    // Inicia a deteção da mão em tempo real (Background process)
    handPose.detectStart(video, (res) => {
        hands = res;
    });

    // Coloca o cursor no centro do ecrã inicialmente
    cursorX = width / 2;
    cursorY = height / 2;
}

/**
 * Loop principal de desenho (corre a ~60 frames por segundo)
 */
function draw() {
    image(video, 0, 0, width, height); // Desenha o frame atual da câmara

    if (!gameActive || isPaused) return; // Se o jogo estiver parado, não processa lógica

    // Troca os alvos se o tempo de intervalo (interval) terminar
    if (millis() - lastChange > valinit.interval) generateCircles();

    // Desenha cada círculo alvo no ecrã
    circles.forEach(c => {
        drawProfessionalTarget(c);
    });

    // Se a IA detetar uma mão, processa a posição do dedo indicador
    if (hands.length > 0) {
        let finger = hands[0].index_finger_tip;

        // Aplicação de LERP: O cursorX "persegue" o finger.x suavemente
        if (abs(finger.x - cursorX) > deadZone) cursorX = lerp(cursorX, finger.x, lerpFactor);
        if (abs(finger.y - cursorY) > deadZone) cursorY = lerp(cursorY, finger.y, lerpFactor);

        drawProfessionalCursor(cursorX, cursorY); // Desenha a mira
        checkCollisions({ x: cursorX, y: cursorY }); // Verifica se a mira toca num círculo
    }
}

/**
 * Inicia o jogo com as definições de cada nível
 */
function startGame(level) {
    correct = 0; wrong = 0; gameActive = true; isPaused = false;
    // Manipulação de interface (DOM)
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('instructions-screen').style.display = 'none';

    // Ajuste de parâmetros de dificuldade
    switch(level) {
        case 'easy': valinit = { size: 90, hitDist: 45, interval: 6000, hold: false, black: false, time: 40 }; break;
        case 'medium': valinit = { size: 70, hitDist: 30, interval: 4000, hold: true, black: false, time: 35 }; break;
        case 'hard': valinit = { size: 50, hitDist: 20, interval: 2500, hold: false, black: true, time: 30 }; break;
    }
    
    timeLeft = valinit.time;
    generateCircles();
    updateHUD();
    startTimer();
}

/**
 * Pausa o cronómetro e a lógica de colisão
 */
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? "CONTINUAR" : "PAUSA";
}

/**
 * Para tudo e regressa ao ecrã inicial
 */
function backToMenu() {
    gameActive = false; isPaused = false;
    if (gameTimer) clearInterval(gameTimer);
    document.getElementById('hud').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('instructions-screen').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}

/**
 * Lê as instruções de um ficheiro externo .txt via Fetch API
 */
function showInstructions() {
    fetch('instructions.txt')
        .then(r => r.text())
        .then(data => {
            document.getElementById('instructions-text').innerText = data;
            document.getElementById('menu').style.display = 'none';
            document.getElementById('instructions-screen').style.display = 'flex';
        })
        .catch(() => {
            document.getElementById('instructions-text').innerText = 'Instruções não encontradas.';
            document.getElementById('instructions-screen').style.display = 'flex';
        });
}

// --- LÓGICA DE DESENHO E FISÍCA ---

function drawProfessionalTarget(c) {
    push();
    fill(0, 60); noStroke(); // Sombra projetada
    circle(c.x + 4, c.y + 4, c.size); 
    fill(c.rgb);
    stroke(255); strokeWeight(3);
    circle(c.x, c.y, c.size);
    
    // Desenha o arco de progresso se o modo for "Segurar" (Hold)
    if (valinit.hold && targetColor && c.name === targetColor.name) {
        stroke(255); strokeWeight(6); noFill();
        arc(c.x, c.y, c.size + 15, c.size + 15, -HALF_PI, map(c.hold, 0, 100, 0, TWO_PI) - HALF_PI);
    }
    pop();
}

/**
 * Desenha a mira Magenta (Cruz + Círculo)
 */
function drawProfessionalCursor(x, y) {
    push();
    stroke(255, 0, 255); strokeWeight(2.5); noFill();
    circle(x, y, 26); 
    line(x - 16, y, x + 16, y);
    line(x, y - 16, x, y + 16);
    fill(255); noStroke();
    circle(x, y, 6);
    pop();
}

/**
 * Compara a distância do cursor com cada círculo
 */
function checkCollisions(pos) {
    for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        if (dist(pos.x, pos.y, c.x, c.y) < (c.size / 2 + valinit.hitDist)) {
            if (c.isBlack) {
                handleHit(false, i); // Círculo preto é sempre erro
            } else if (targetColor && c.name === targetColor.name) {
                if (valinit.hold) {
                    c.hold += 5; // Aumenta progresso do clique longo
                    if (c.hold >= 100) handleHit(true, i);
                } else {
                    handleHit(true, i); // Clique imediato
                }
            } else {
                handleHit(false, i); // Cor errada
            }
            updateHUD();
        }
    }
}

/**
 * Gere o resultado de um toque (som e pontuação)
 */
function handleHit(isCorrect, index) {
    if (isCorrect) {
        correct++;
        soundCorrect.play();
        circles.splice(index, 1); // Remove círculo acertado
        pickNewTarget();
    } else {
        wrong++;
        soundError.play();
        circles.splice(index, 1);
    }
}

/**
 * Cria novos círculos em posições aleatórias mas seguras (longe das bordas)
 */
function generateCircles() {
    circles = [];
    for (let i = 0; i < 4; i++) {
        let pos = getSafePos();
        circles.push({ x: pos.x, y: pos.y, rgb: palette[i].rgb, name: palette[i].name, size: valinit.size, hold: 0, isBlack: false });
    }
    // Adiciona o círculo preto (obstáculo) no nível Difícil
    if (valinit.black) {
        let pos = getSafePos();
        circles.push({ x: pos.x, y: pos.y, rgb: [0,0,0], name: 'PRETO', size: valinit.size, isBlack: true });
    }
    pickNewTarget();
    lastChange = millis();
}

/**
 * Calcula posição aleatória garantindo que os círculos não fiquem uns sobre os outros
 */
function getSafePos() {
    let x, y, tooClose;
    let attempts = 0;
    do {
        tooClose = false;
        x = random(90, width - 90);
        y = random(120, height - 90);
        for (let c of circles) if (dist(x, y, c.x, c.y) < 130) tooClose = true;
        attempts++;
    } while (tooClose && attempts < 50);
    return { x, y };
}

/**
 * Define qual é a cor que o utilizador deve procurar agora
 */
function pickNewTarget() {
    let options = circles.filter(c => !c.isBlack);
    if (options.length > 0) {
        targetColor = random(options);
        let el = document.getElementById('target-name');
        el.innerText = targetColor.name;
        el.style.color = `rgb(${targetColor.rgb[0]},${targetColor.rgb[1]},${targetColor.rgb[2]})`;
    }
}

/**
 * Cronómetro de 1 em 1 segundo
 */
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

// Vincula as funções locais ao objeto Window para que os botões HTML as encontrem
window.startGame = startGame;
window.backToMenu = backToMenu;
window.togglePause = togglePause;
window.showInstructions = showInstructions;