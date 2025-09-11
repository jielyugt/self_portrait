/**
 * Main sketch file for Portrait Generator
 * Handles p5.js setup, face loading, blending, and rendering
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  // Import modules and configuration
  const { CONFIG } = FaceApp;
  const { Morph } = FaceApp;
  const { LIB, exportJSON, importJSONFile } = FaceApp.Shapes;
  const { composeFace } = FaceApp.Renderer;
  const { initUI } = FaceApp.UI;

  // Global state variables
  let pg;                                              // Off-screen graphics buffer
  let faceSets = [];                                   // Array of loaded face data
  let currentBlendWeights = [...CONFIG.BLENDING.DEFAULT_WEIGHTS]; // Current blend weights
  let hexagonUI;                                       // Hexagon UI controller

  /**
   * p5.js setup function - initializes canvas and loads face data
   */
  window.setup = async function () {
    createCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);

    // Load all face data from JSON files
    await loadFaceData();
    console.log('Loaded faceSets:', faceSets);

    // Initialize the hexagon UI for blend control
    initializeHexagonUI();

    // Setup UI event handlers
    setupUIHandlers();
  };

  /**
   * Loads face data from JSON files and converts to internal format
   */
  async function loadFaceData() {
    faceSets = await Promise.all(CONFIG.FACES.FILES.map(async (file) => {
      const data = await fetch(file).then(r => r.json());

      // Convert array format to point objects
      const raw = {
        head: arrayToPoints(data.face),
        left_eye: arrayToPoints(data.left_eye),
        right_eye: arrayToPoints(data.right_eye),
        mouth: arrayToPoints(data.mouth)
      };

      return normalizeFaceSet(raw);
    }));
  }

  /**
   * Converts array of [x,y] coordinates to array of {x,y} point objects
   * @param {Array} arr - Array of [x, y] coordinate pairs
   * @returns {Array} Array of {x, y} point objects
   */
  function arrayToPoints(arr) {
    return (arr || []).map(([x, y]) => ({ x, y }));
  }

  /**
   * Normalizes face set data (currently just passes through, but allows for future processing)
   * @param {Object} set - Raw face set data
   * @returns {Object} Normalized face set
   */
  function normalizeFaceSet(set) {
    return {
      head: set.head,
      left_eye: set.left_eye,
      right_eye: set.right_eye,
      mouth: set.mouth
    };
  }

  /**
   * Initializes the hexagon UI component
   */
  function initializeHexagonUI() {
    hexagonUI = new FaceApp.HexagonUI('hexCanvas', handleBlendChange);
  }

  /**
   * Sets up UI event handlers
   */
  function setupUIHandlers() {
    // Setup randomize button
    document.getElementById('randomBtn').onclick = () => {
      hexagonUI.randomize();
    };
  }

  /**
   * Handles blend weight changes from the hexagon UI
   * @param {Array} weights - Array of 6 blend weights (sum to 1.0)
   */
  function handleBlendChange(weights) {
    currentBlendWeights = weights;
    console.log('Blend weights changed:', weights);
  }

  /**
   * Blends multiple face sets based on provided weights
   * @param {Array} weights - Array of blend weights for each face
   * @returns {Object} Blended face data with head, eyes, and mouth
   */
  function blendFaceSets(weights) {
    // Extract point arrays for each component from all face sets
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

  /**
   * Blends arrays of point data using weighted averaging
   * @param {Array} pointArrays - Array of point arrays to blend
   * @param {Array} weights - Blend weights for each point array
   * @returns {Array} Blended point array
   */
  function blendPoints(pointArrays, weights) {
    if (!pointArrays.length) return [];

    // Find the maximum number of points across all arrays
    const maxPoints = Math.max(...pointArrays.map(arr => arr ? arr.length : 0));
    if (maxPoints === 0) return [];

    const result = [];

    // Blend each point position
    for (let i = 0; i < maxPoints; i++) {
      let x = 0, y = 0;
      let totalWeight = 0;

      // Weighted average across all face variations
      for (let j = 0; j < pointArrays.length; j++) {
        if (pointArrays[j] && pointArrays[j][i]) {
          const point = pointArrays[j][i];

          // Validate point coordinates before using
          if (isValidPoint(point)) {
            x += point.x * weights[j];
            y += point.y * weights[j];
            totalWeight += weights[j];
          }
        }
      }

      // Only add point if we have valid weighted data
      if (totalWeight > CONFIG.BLENDING.MIN_WEIGHT_THRESHOLD) {
        result.push({
          x: x / totalWeight,
          y: y / totalWeight
        });
      }
    }

    return result;
  }

  /**
   * Validates if a point has valid numeric coordinates
   * @param {Object} point - Point object with x, y properties
   * @returns {boolean} True if point is valid
   */
  function isValidPoint(point) {
    return typeof point.x === 'number' &&
      typeof point.y === 'number' &&
      !isNaN(point.x) &&
      !isNaN(point.y);
  }

  /**
   * p5.js draw function - main rendering loop
   */
  window.draw = function () {
    // Skip rendering if face data hasn't loaded yet
    if (!faceSets.length) {
      return;
    }

    // Clear canvas and graphics buffer
    background(CONFIG.CANVAS.BACKGROUND_COLOR);
    pg.clear();

    // Calculate rendering parameters
    const size = Math.min(width, height) * CONFIG.CANVAS.SIZE_RATIO;
    const cx = width / 2;  // Center X
    const cy = height / 2; // Center Y

    // Get blended face data based on current weights
    const blendedPoints = blendFaceSets(currentBlendWeights);

    // Apply organic animation to head outline if enabled
    const points = {
      head: CONFIG.ANIMATION.ORGANIC_NOISE.ENABLED
        ? addOrganicNoise(blendedPoints.head, millis())
        : blendedPoints.head,
      left_eye: blendedPoints.left_eye,
      right_eye: blendedPoints.right_eye,
      mouth: blendedPoints.mouth
    };

    // Render the complete face
    composeFace(pg, points, cx, cy, size);
    image(pg, 0, 0);
  };

  /**
   * Adds organic noise animation to points for natural movement
   * @param {Array} points - Array of points to animate
   * @param {number} time - Current time in milliseconds
   * @returns {Array} Points with organic noise applied
   */
  function addOrganicNoise(points, time) {
    const config = CONFIG.ANIMATION.ORGANIC_NOISE;

    return points.map((p, i) => {
      // Calculate time-based animation values
      const timeX = time * config.TIME_SPEED;
      const timeY = time * config.TIME_SPEED * config.TIME_OFFSET_Y;
      const uniqueOffset = i * config.UNIQUE_OFFSET;

      // Generate Perlin noise offsets
      const offsetX = noise(
        p.x * config.SCALE + timeX,
        p.y * config.SCALE,
        uniqueOffset
      ) - 0.5;

      const offsetY = noise(
        p.x * config.SCALE + 1000,
        p.y * config.SCALE + timeY,
        uniqueOffset + 100
      ) - 0.5;

      // Apply noise with configurable strength
      return {
        x: p.x + offsetX * config.STRENGTH,
        y: p.y + offsetY * config.STRENGTH
      };
    });
  }

  /**
   * Handles window resize events
   */
  window.windowResized = function () {
    resizeCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);
  };

  /**
   * Handles keyboard input
   */
  window.keyPressed = function () {
    if (key.toLowerCase() === CONFIG.UI.SHORTCUTS.SAVE_KEY) {
      saveCanvas(CONFIG.UI.FILES.EXPORT_NAME, 'png');
    }
  };

})(window);
