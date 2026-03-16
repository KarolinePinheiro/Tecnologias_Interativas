 //PART 1 : Codigo Da mao e hand Finger.
 let video;

let handPose;

let hands = [];


function preload() {

  // Initialize HandPose model with flipped video input

  handPose = ml5.handPose({ flipped: true });

}


function mousePressed() {

  console.log(hands);

}


function gotHands(results) {

  hands = results;

}


function setup() {

  createCanvas(640, 480);

  painting = createGraphics(640,480);

  video = createCapture(VIDEO, { flipped: true });

  video.hide();


  // Start detecting hands

  handPose.detectStart(video, gotHands);

}


function draw() {

  image(video, 0, 0);


  // Ensure at least one hand is detected

  if (hands.length > 0) {

    let hand= hands[0];

    let index = hand.index_finger_tip;

    //let ring = hand.ring_finger_tip;

    //let wrist= hand.wrist;

    painting.noStroke();

    painting.fill(255,0,255);

    painting.circle(index.x,index.y,16);

    //circle(ring.x,ring.y,16);

    //circle(wrist.x,wrist.y,16);

  }

  image(painting,0,0);

} 


//PART 2: Fading cursor.
let video;
let handPose;
let hands = [];
let painting;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  painting = createGraphics(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);
}

function draw() {
  image(video, 0, 0);

  // Efeito de fading em transparência
  painting.push();
  painting.blendMode(REMOVE); // "Apaga" gradualmente o que foi desenhado
  painting.fill(255, 20);      // O valor 20 controla a velocidade do fade
  painting.rect(0, 0, width, height);
  painting.pop();

  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;
    
    painting.noStroke();
    painting.fill(255, 200, 255);
    painting.ellipse(index.x, index.y, 16);
  }

  image(painting, 0, 0);
}

//Part 3: Random Colors.

let target = {
  x: 0,
  y: 0,
  r: 30,
  color: "verde"
};

let instructionColor = "verde";
let targetTimer = 0;
let targetInterval = 1000; // Tempo em milissegundos para mudar o círculo

function setup() {
  createCanvas(640, 480);
  newTarget(); // Gera o primeiro círculo
}

function draw() {
  background(220);

  // Lógica para mudar o círculo após o intervalo de tempo
  if (millis() - targetTimer > targetInterval) {
    newTarget();
  }

  drawTarget();
}

// Escolhe uma posição e cor aleatória
function newTarget() {
  target.x = random(80, width - 80);
  target.y = random(100, height - 80);
  
  let colors = ["verde", "vermelho", "azul"];
  target.color = random(colors);
  instructionColor = random(colors);
  
  targetTimer = millis(); // Reinicia o cronómetro
}

// Desenha o círculo no canvas baseado no estado atual do objeto target
function drawTarget() {
  if (target.color === "verde") fill(0, 255, 0);
  else if (target.color === "vermelho") fill(255, 0, 0);
  else if (target.color === "azul") fill(0, 150, 255);
  
  noStroke();
  circle(target.x, target.y, target.r * 2);
}


//part 4; 
