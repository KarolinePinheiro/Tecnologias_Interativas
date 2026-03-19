let video;
let handPose;
let hands = [];
let painting;

// Círculos
let numCircles = 4;
let circleRadius = 35;
let circles = [];
let score = 0; // Adicionado para a lógica de colisão

// Tempo
let targetInterval = 2000; 
let lastChange = 0;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);
  
  // Camada apenas para o rastro
  painting = createGraphics(640, 480);
  painting.clear();

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  
  handPose.detectStart(video, gotHands);

  generateCircles();
}

function draw() {
  // 1. Mostrar vídeo (Fundo)
  image(video, 0, 0);

  // 2. Fading do rastro (Apenas na camada painting)
  painting.erase(20, 20); 
  painting.rect(0, 0, width, height);
  painting.noErase();

  // 3. Atualizar círculos pelo tempo
  if (millis() - lastChange > targetInterval) {
    generateCircles();
  }

  // 4. Desenhar círculos
  drawCircles();

  // 5. Desenhar dedo no layer de pintura e VERIFICAR COLISÃO
  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;

    if (index) {
      // Desenho do rastro
      painting.noStroke();
      painting.fill(255, 0, 255);
      painting.circle(index.x, index.y, 18);

      // --- Lógica de Colisão Inserida ---
      for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        let d = dist(index.x, index.y, c.x, c.y);

        if (d < c.r) {
          circles.splice(i, 1); // Remove o círculo atingido
          score += 10;          // Aumenta a pontuação
          
          // Opcional: gera novos círculos se todos forem atingidos
          if (circles.length === 0) generateCircles();
        }
      }
      // ----------------------------------
    }
  }

  // 6. Mostrar layer do rastro
  image(painting, 0, 0);
  
  // Extra: Mostrar score no ecrã
  fill(255);
  textSize(20);
  text("Score: " + score, 20, 30);
}

function generateCircles() {
  circles = [];
  let colors = [
    [0, 255, 0],   // Verde
    [255, 0, 0],   // Vermelho
    [0, 150, 255], // Azul
    [255, 255, 0]  // Amarelo
  ];
  shuffle(colors, true);

  let minDist = 140; 

  for (let i = 0; i < numCircles; i++) {
    let valid = false;
    let x, y;

    while (!valid) {
      x = random(80, width - 80);
      y = random(80, height - 80);
      valid = true;
      for (let j = 0; j < circles.length; j++) {
        let c = circles[j];
        let d = dist(x, y, c.x, c.y);
        if (d < minDist) {
          valid = false;
          break;
        }
      }
    }
    
    circles.push({
      x: x,
      y: y,
      r: circleRadius,
      color: colors[i % colors.length]
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

function gotHands(results) {
  hands = results;
}