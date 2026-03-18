let video;
let handPose;
let hands = [];
let painting;

// Círculos
let numCircles = 4;
let circleRadius = 35;
let circles = [];

// Tempo
let interval = 2000; 
let lastChange = 0;

function preload() {
  // CORREÇÃO: Para usar detectStart, a função é ml5.handPose()
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  painting = createGraphics(640, 480);

  // Criar o vídeo com flip para parecer um espelho
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  // Iniciar a detecção contínua
  handPose.detectStart(video, gotHands);

  generateCircles();
}

function draw() {
  background(220);
  
  // Desenha o vídeo (já vem invertido pelo flipped: true)
  image(video, 0, 0);

  // Atualiza círculos a cada 2 segundos
  if (millis() - lastChange > interval) {
    generateCircles();
  }

  drawCircles();
  drawFinger();
  
  // Desenha a camada de pintura acumulada
  image(painting, 0, 0);
}

// -------------------------
// GERA CÍRCULOS COM FOR TRADICIONAL
// -------------------------
function generateCircles() {
  circles = [];
  let colors = [
    [0, 255, 0],   // Verde
    [255, 0, 0],   // Vermelho
    [0, 150, 255], // Azul
    [255, 255, 0]  // Amarelo
  ];

  // Baralha as cores
  shuffle(colors, true);

  let minDist = 140; 

  for (let i = 0; i < numCircles; i++) {
    let valid = false;
    let x, y;

    while (!valid) {
      x = random(80, width - 80);
      y = random(80, height - 80);
      valid = true;

      // Loop for tradicional para verificar distância dos círculos anteriores
      for (let j = 0; j < circles.length; j++) {
        let c = circles[j];
        let d = dist(x, y, c.x, c.y);
        if (d < minDist) {
          valid = false;
          break;
        }
      }
    }

    // Atribuição de cor usando o índice i do loop for
    let corEscolhida = colors[i];

    circles.push({
      x: x,
      y: y,
      r: circleRadius,
      color: corEscolhida
    });
  }

  lastChange = millis();
}

function drawCircles() {
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    fill(c.color[0], c.color[1], c.color[2]);
    noStroke();
    circle(c.x, c.y, c.r * 2);
  }
}

function drawFinger() {
  // Verifica se há pelo menos uma mão detetada
  if (hands.length > 0) {
    let hand = hands[0];
    
    // Na v1.2.1, os pontos têm nomes diretos
    let index = hand.index_finger_tip;

    if (index) {
      painting.noStroke();
      painting.fill(255, 0, 255);
      // O flipped: true no setup já alinha o X do dedo com o vídeo
      painting.circle(index.x, index.y, 18);
    }
  }
}

function gotHands(results) {
  hands = results;
}