// sketch.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { Morph } = FaceApp;
  const { LIB, exportJSON, importJSONFile } = FaceApp.Shapes;
  const { composeFace } = FaceApp.Renderer;
  const { initUI } = FaceApp.UI;

  let headMorph, eyeMorph, mouthMorph;
  let pg;

  // p5 global mode
  window.setup = function () {
    createCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);

    // Morphers
    headMorph  = new Morph(LIB.head,  'head_front');
    eyeMorph   = new Morph(LIB.eyes,  'eyes_open');
    mouthMorph = new Morph(LIB.mouth, 'mouth_neutral');

    // UI
    const initial = initUI(handleChange, () => exportJSON(), (file) => {
      importJSONFile(file, () => {
        // Rebuild morphers (keep current selections if still valid)
        headMorph  = new Morph(LIB.head,  initial.head in LIB.head ? initial.head : Object.keys(LIB.head)[0]);
        eyeMorph   = new Morph(LIB.eyes,  initial.eyes in LIB.eyes ? initial.eyes : Object.keys(LIB.eyes)[0]);
        mouthMorph = new Morph(LIB.mouth, initial.mouth in LIB.mouth ? initial.mouth : Object.keys(LIB.mouth)[0]);
        alert('Shapes imported!');
      }, () => alert('Invalid JSON.'));
    });
  };

  function handleChange(kind, key) {
    if (kind === 'head')  headMorph.setTarget(key);
    if (kind === 'eyes')  eyeMorph.setTarget(key);
    if (kind === 'mouth') mouthMorph.setTarget(key);
  }

  window.draw = function () {
    background('#f7f4ee');

    const dt = deltaTime / 1000;
    headMorph.update(dt); eyeMorph.update(dt); mouthMorph.update(dt);

    pg.clear();

    const size = Math.min(width, height) * 0.72;
    const cx = width / 2, cy = height / 2;

    composeFace(pg, {
      head: headMorph.points(),
      eyes: eyeMorph.points(),
      mouth: mouthMorph.points()
    }, cx, cy, size);

    image(pg, 0, 0);

    headMorph.commitIfDone();
    eyeMorph.commitIfDone();
    mouthMorph.commitIfDone();
  };

  window.windowResized = function () {
    resizeCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);
  };

  window.keyPressed = function () {
    if (key.toLowerCase() === 's') saveCanvas('portrait', 'png');
  };

})(window);
