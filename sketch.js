// sketch.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { Morph } = FaceApp;
  const { LIB, exportJSON, importJSONFile } = FaceApp.Shapes;
  const { composeFace } = FaceApp.Renderer;
  const { initUI } = FaceApp.UI;

  let pg;
  let faceSets = [];
  let currentBlendWeights = [1, 0, 0, 0, 0, 0]; // Start with 100% face 1
  let hexagonUI;

  // p5 global mode
  window.setup = async function () {
    createCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);

    // Load all face JSON files
    const faceFiles = [
      'faces/face_1.json',
      'faces/face_2.json',
      'faces/face_3.json',
      'faces/face_4.json',
      'faces/face_5.json',
      'faces/face_6.json'
    ];
    function arrToPts(arr) {
      return (arr || []).map(([x, y]) => ({ x, y }));
    }
    // No normalization needed - JSON data is already in [0,1] coordinate space
    function normalizeFaceSet(set) {
      return {
        head: set.head,
        left_eye: set.left_eye,
        right_eye: set.right_eye,
        mouth: set.mouth
      };
    }
    faceSets = await Promise.all(faceFiles.map(async (file) => {
      const data = await fetch(file).then(r => r.json());
      const raw = {
        head: arrToPts(data.face),
        left_eye: arrToPts(data.left_eye),
        right_eye: arrToPts(data.right_eye),
        mouth: arrToPts(data.mouse)
      };
      return normalizeFaceSet(raw);
    }));
    console.log('Loaded faceSets:', faceSets);

    // Initialize hexagon UI
    hexagonUI = new FaceApp.HexagonUI('hexCanvas', handleBlendChange);

    // Setup randomize button
    document.getElementById('randomBtn').onclick = () => {
      hexagonUI.randomize();
    };
  };

  function handleBlendChange(weights) {
    currentBlendWeights = weights;
    console.log('Blend weights changed:', weights);
  }

  // Function to blend multiple face sets based on weights
  function blendFaceSets(weights) {
    function blendPoints(pointArrays, weights) {
      if (!pointArrays.length) return [];

      // Find the maximum number of points across all arrays
      const maxPoints = Math.max(...pointArrays.map(arr => arr ? arr.length : 0));
      if (maxPoints === 0) return [];

      const result = [];

      for (let i = 0; i < maxPoints; i++) {
        let x = 0, y = 0;
        let totalWeight = 0;

        for (let j = 0; j < pointArrays.length; j++) {
          if (pointArrays[j] && pointArrays[j][i]) {
            const point = pointArrays[j][i];
            // Validate point coordinates
            if (typeof point.x === 'number' && typeof point.y === 'number' &&
              !isNaN(point.x) && !isNaN(point.y)) {
              x += point.x * weights[j];
              y += point.y * weights[j];
              totalWeight += weights[j];
            }
          }
        }

        // Only add point if we have valid data
        if (totalWeight > 0) {
          result.push({
            x: x / totalWeight,
            y: y / totalWeight
          });
        }
      }

      return result;
    }

    const heads = faceSets.map(set => set.head);
    const leftEyes = faceSets.map(set => set.left_eye);
    const rightEyes = faceSets.map(set => set.right_eye);
    const mouths = faceSets.map(set => set.mouth);

    return {
      head: blendPoints(heads, weights),
      left_eye: blendPoints(leftEyes, weights),
      right_eye: blendPoints(rightEyes, weights),
      mouth: blendPoints(mouths, weights)
    };
  }

  window.draw = function () {
    if (!faceSets.length) {
      return;
    }

    background('#ffffff');
    pg.clear();

    const size = Math.min(width, height) * 0.72;
    const cx = width / 2, cy = height / 2;

    // Get blended points based on current weights
    const blendedPoints = blendFaceSets(currentBlendWeights);

    // Add organic noise to head points
    function addOrganicNoise(points, time, strength = 0.1) {
      return points.map((p, i) => {
        const noiseScale = 0.005;
        const timeSpeed = 0.0003;
        const uniqueOffset = i * 0.05;

        const timeX = time * timeSpeed;
        const timeY = time * timeSpeed * 1.37;

        const offsetX = noise(p.x * noiseScale + timeX, p.y * noiseScale, uniqueOffset) - 0.5;
        const offsetY = noise(p.x * noiseScale + 1000, p.y * noiseScale + timeY, uniqueOffset + 100) - 0.5;

        return {
          x: p.x + offsetX * strength,
          y: p.y + offsetY * strength
        };
      });
    }

    const currentTime = millis();
    const points = {
      head: addOrganicNoise(blendedPoints.head, currentTime),
      left_eye: blendedPoints.left_eye,
      right_eye: blendedPoints.right_eye,
      mouth: blendedPoints.mouth
    };

    composeFace(pg, points, cx, cy, size);
    image(pg, 0, 0);
  };

  window.windowResized = function () {
    resizeCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);
  };

  window.keyPressed = function () {
    if (key.toLowerCase() === 's') saveCanvas('portrait', 'png');
  };

})(window);
