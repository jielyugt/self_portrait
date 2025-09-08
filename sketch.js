function setup() {
  createCanvas(400, 400);
}

function draw() {
  background("aqua");

  // Face
  fill(255, 224, 189);
  noStroke();
  ellipse(200, 200, 120, 150);

  // Eyes
  fill(255);
  ellipse(180, 200, 25, 15);
  ellipse(220, 200, 25, 15);

  fill(50, 35, 20);
  ellipse(180, 200, 10, 10);
  ellipse(220, 200, 10, 10);

  // Nose
  fill(230, 190, 138);
  ellipse(200, 220, 15, 10);

  // Mouth
  fill(200, 120, 100);
  ellipse(200, 240, 30, 10);

  // Hair
  fill(60, 40, 20);
  ellipse(200, 150, 110, 60);
  ellipse(140, 210, 40, 100);
  ellipse(260, 210, 40, 100);

  // Body
  fill(80, 60, 40);
  ellipse(200, 320, 90, 120);
}
