// -------------------------
// VARIÁVEIS DO ALVO
// -------------------------
let target = {
  x: 0,
  y: 0,
  r: 30,
  color: "verde"
};

let instructionColor = "verde";
let targetTimer = 0;
let targetInterval = 1000; // muda a cada 1 segundo

// -------------------------
// VARIÁVEIS DO HANDPOSE
// -------------------------
let video;
let handPose;
let hands = [];
let painting;

// -------------------------
// PRELOAD (carrega o modelo)
// -------------------------
function preload() {
  handPose = ml5.handPose({ flipped: true });
}

// -------------------------
// SETUP
// -------------------------
function setup() {
  createCanvas(640, 480);

  // Canvas auxiliar para desenhar o dedo
  painting = createGraphics(640, 480);

  // Vídeo
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Iniciar deteção
  handPose.detectStart(video, gotHands);

  // Criar primeiro alvo
  newTarget();
}

// -------------------------
// DRAW
// -------------------------
function draw() {
  background(220);

  // Mostrar vídeo
  image(video, 0, 0);

  // Atualizar alvo se passou o intervalo
  if (millis() - targetTimer > targetInterval) {
    newTarget();
  }

  // Desenhar alvo
  drawTarget();

  // Desenhar dedo se existir mão
  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;

    painting.noStroke();
    painting.fill(255, 0, 255);
    painting.circle(index.x, index.y, 16);
  }

  // Mostrar layer do dedo
  image(painting, 0, 0);
}

// -------------------------
// CALLBACK DO HANDPOSE
// -------------------------
function gotHands(results) {
  hands = results;
}

// -------------------------
// GERA NOVO ALVO
// -------------------------
function newTarget() {
  target.x = random(80, width - 80);
  target.y = random(100, height - 80);

  let colors = ["verde", "vermelho", "azul"];
  target.color = random(colors);
  instructionColor = random(colors);

  targetTimer = millis();
}

// -------------------------
// DESENHA O ALVO
// -------------------------
function drawTarget() {
  if (target.color === "verde") fill(0, 255, 0);
  else if (target.color === "vermelho") fill(255, 0, 0);
  else if (target.color === "azul") fill(0, 150, 255);

  noStroke();
  circle(target.x, target.y, target.r * 2);
}

// -------------------------
// DEBUG
// -------------------------
function mousePressed() {
  console.log(hands);
}
