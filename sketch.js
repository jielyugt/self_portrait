let step = 0;
let headShape = null;
let mood = null;

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(24);
}

function draw() {
  background("aqua");

  if (step === 0) {
    // Ask for head shape
    fill(0);
    text("Choose head shape:", 200, 120);
    // Draw buttons
    fill(255);
    ellipse(140, 200, 80, 80); // Circle button
    fill(0);
    text("Circle", 140, 200);
    fill(255);
    rect(220, 160, 80, 80, 10); // Square button
    fill(0);
    text("Square", 260, 200);
  } else if (step === 1) {
    // Ask for mood
    fill(0);
    text("Choose mood:", 200, 120);
    // Draw buttons
    fill(255);
    ellipse(140, 200, 80, 80); // Happy button
    fill(0);
    text("Happy", 140, 200);
    fill(255);
    ellipse(260, 200, 80, 80); // Sad button
    fill(0);
    text("Sad", 260, 200);
  } else if (step === 2) {
    // Draw stick figure based on choices
    drawStickFigure(headShape, mood);
  }
}

function mousePressed() {
  if (step === 0) {
    // Check which button was clicked
    if (dist(mouseX, mouseY, 140, 200) < 40) {
      headShape = "circle";
      step = 1;
    } else if (mouseX > 220 && mouseX < 300 && mouseY > 160 && mouseY < 240) {
      headShape = "square";
      step = 1;
    }
  } else if (step === 1) {
    if (dist(mouseX, mouseY, 140, 200) < 40) {
      mood = "happy";
      step = 2;
    } else if (dist(mouseX, mouseY, 260, 200) < 40) {
      mood = "sad";
      step = 2;
    }
  }
}

function drawStickFigure(shape, mood) {
  // Body
  stroke(0);
  strokeWeight(4);
  line(200, 250, 200, 350); // torso
  line(200, 270, 170, 320); // left arm
  line(200, 270, 230, 320); // right arm
  line(200, 350, 170, 390); // left leg
  line(200, 350, 230, 390); // right leg

  // Head
  noStroke();
  fill(255, 224, 189);
  if (shape === "circle") {
    ellipse(200, 220, 60, 60);
  } else {
    rect(170, 190, 60, 60, 10);
  }

  // Face
  fill(0);
  // Eyes
  if (shape === "circle") {
    ellipse(190, 220, 8, 8);
    ellipse(210, 220, 8, 8);
  } else {
    ellipse(185, 220, 8, 8);
    ellipse(215, 220, 8, 8);
  }
  // Mouth
  noFill();
  stroke(0);
  strokeWeight(2);
  if (mood === "happy") {
    arc(200, 235, 24, 12, 0, PI);
  } else {
    arc(200, 240, 24, 12, PI, 0);
  }
}
