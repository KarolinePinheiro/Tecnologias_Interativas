let video;
let handPose;
let hands = [];
let painting; // Camada transparente para o rastro

// Configurações dos Alvos
let circles = [];
let numCircles = 4;
let circleRadius = 40;
let interval = 4000; 
let lastChange = 0;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  
  // Criamos a camada de rastro (transparente)
  painting = createGraphics(640, 480);
  painting.clear();

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  
  handPose.detectStart(video, gotHands);
  generateCircles();
}

function draw() {
  // 1. O VÍDEO é desenhado primeiro (100% opacidade para a pessoa se ver bem)
  tint(255, 255); 
  image(video, 0, 0);

  // 2. LÓGICA DO FADING (Apenas na camada 'painting')
  // Usamos erase() para fazer o rastro desaparecer suavemente sem escurecer o ecrã
  painting.push();
  painting.erase(20, 20); // O número 20 define a velocidade do desaparecimento (calmo)
  painting.rect(0, 0, width, height);
  painting.noErase();
  painting.pop();

  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;

    if (index) {
      // Desenha o rastro do dedo (simples e sem brilhos excessivos)
      painting.noStroke();
      painting.fill(200, 0, 200, 150); // Roxo suave com alguma transparência
      painting.circle(index.x, index.y, 20);
    }
  }

  // 3. DESENHA A CAMADA DE PINTURA SOBRE O VÍDEO
  image(painting, 0, 0);

  // 4. DESENHA OS ALVOS (Sempre nítidos e fáceis de ver)
  if (millis() - lastChange > interval) {
    generateCircles();
  }
  drawCircles();
}

function generateCircles() {
  circles = [];
  // Cores sólidas e contrastantes
  let colors = [
    [0, 200, 0],   // Verde
    [200, 0, 0],   // Vermelho
    [0, 100, 255], // Azul
    [255, 200, 0]  // Amarelo
  ];
  shuffle(colors, true);

  for (let i = 0; i < numCircles; i++) {
    let x = random(100, width - 100);
    let y = random(100, height - 100);
    circles.push({ x: x, y: y, r: circleRadius, color: colors[i] });
  }
  lastChange = millis();
}

function drawCircles() {
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    
    // Desenha o alvo com uma borda grossa para facilitar a visão
    stroke(255);
    strokeWeight(4);
    fill(c.color);
    circle(c.x, c.y, c.r * 2);
    
    // Um pequeno ponto central para ajudar no foco do olhar
    noStroke();
    fill(255);
    circle(c.x, c.y, 8);
  }
}

function gotHands(results) {
  hands = results;
}