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
  let currentMBTIValues = [...CONFIG.MBTI.DEFAULT_VALUES]; // Current MBTI values [e_i, s_n, t_f, j_p]
  let currentFaceParams = {};                          // Current face shape parameters
  let chatUI;                                          // Chat UI controller
  let currentMode = 'chat';                            // Current interaction mode: 'chat', 'self'
  let portraitSize = CONFIG.CANVAS.SIZE_RATIO;     // Portrait size when chat is active

  // Morphing animation state
  let morphTarget = null;                              // Target MBTI values for morphing
  let morphStartTime = 0;                              // When current morph started
  let morphDuration = CONFIG.ANIMATION.MORPH.DURATION_SEC * 1000; // Morph duration in milliseconds
  let morphStartValues = null;                         // Starting MBTI values for morph

  /**
   * p5.js setup function - initializes canvas and loads face data
   */
  window.setup = async function () {
    createCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth, windowHeight);

    // Load all face data from JSON files
    await loadFaceData();
    console.log('Loaded', faceSets.length, 'face sets');

    // Initialize MBTI system with default values
    currentMBTIValues = [...CONFIG.MBTI.DEFAULT_VALUES];
    currentFaceParams = calculateFaceParametersFromMBTI(currentMBTIValues);

    // Initialize global references
    FaceApp.currentMBTIValues = currentMBTIValues;
    FaceApp.currentFaceParams = currentFaceParams;

    // Setup UI event handlers
    setupUIHandlers();

    // Initialize the Chat UI for Q&A workflow (after a brief delay to ensure DOM is ready)
    setTimeout(() => {
      initializeChatUI();
      updateModeIndicator('Chat - Talk to Pablo');
    }, 100);
  };

  /**
   * Loads face data from JSON files and converts to internal format
   */
  async function loadFaceData() {
    faceSets = await Promise.all(CONFIG.FACES.FILES.map(async (file) => {
      const data = await fetch(file).then(r => r.json());

      // Convert array format to point objects, map 'face' to 'head'
      const raw = {
        head: arrayToPoints(data.face),  // Use 'face' field from JSON
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
   * Normalizes face set data (maps 'face' to 'head' and ensures consistent structure)
   * @param {Object} set - Raw face set data
   * @returns {Object} Normalized face set
   */
  function normalizeFaceSet(set) {
    return {
      head: set.head || set.face,  // Map 'face' to 'head' for consistency
      left_eye: set.left_eye,
      right_eye: set.right_eye,
      mouth: set.mouth
    };
  }

  /**
   * Calculates face shape parameters from MBTI values using the config weights
   * @param {Array} mbtiValues - Array of 4 values between -1 and 1
   * @returns {Object} Object with calculated feature parameters
   */
  function calculateFaceParametersFromMBTI(mbtiValues) {
    const params = {};

    // Calculate each feature parameter using weighted sum
    Object.keys(CONFIG.MBTI.FEATURE_WEIGHTS).forEach(feature => {
      const weights = CONFIG.MBTI.FEATURE_WEIGHTS[feature];
      let value = 0;

      // Only add weights that exist for this feature
      if (weights.e_i !== undefined) value += weights.e_i * mbtiValues[0];  // E/I dimension
      if (weights.s_n !== undefined) value += weights.s_n * mbtiValues[1];  // S/N dimension  
      if (weights.t_f !== undefined) value += weights.t_f * mbtiValues[2];  // T/F dimension
      if (weights.j_p !== undefined) value += weights.j_p * mbtiValues[3];  // J/P dimension

      params[feature] = value;
    });

    return params;
  }  /**
   * Initializes the Chat UI component
   */
  function initializeChatUI() {
    const container = document.getElementById('chatContainer');
    console.log('Chat container found:', !!container);

    if (!container) {
      console.error('Chat container not found!');
      return;
    }

    chatUI = new FaceApp.ChatUI('chatContainer', handleWorkflowChange, handleChatMBTIUpdate);
    console.log('Chat UI initialized');
  }

  /**
   * Handles workflow changes from chat interface
   * @param {string} workflow - 'qa' for Q&A mode, 'self' for self-adjustment mode
   */
  function handleWorkflowChange(workflow) {
    console.log('Workflow changed to:', workflow);

    if (workflow === 'qa') {
      // Switch to Q&A mode
      currentMode = 'qa';
      updateUIDescription('Answer Pablo\'s questions to build your portrait');
      updateModeIndicator('Q&A - Answer Pablo\'s questions');
      portraitSize = CONFIG.CANVAS.SIZE_RATIO;
    } else if (workflow === 'self') {
      // Switch to self-adjustment mode
      currentMode = 'self';
      updateUIDescription('Use the sliders on the phone to adjust your portrait');
      updateModeIndicator('Self-adjustment - Use phone sliders');
      portraitSize = CONFIG.CANVAS.SIZE_RATIO;
    }
  }

  /**
   * Handles MBTI updates from chat Q&A
   * @param {Array} mbtiScores - Raw accumulated scores from chat
   */
  function handleChatMBTIUpdate(mbtiScores) {
    console.log('Chat MBTI update:', mbtiScores);

    // Normalize scores to [-1, 1] range with proper scaling
    // Based on MBTI questions, scores typically range from about -3 to +3 when accumulated
    const normalizedScores = mbtiScores.map(score => {
      // Scale more aggressively: multiply by 1.0 to get full range, then clamp
      const scaled = score * 1.0;
      return Math.max(-1, Math.min(1, scaled));
    });

    // Start morphing animation in QA mode
    if (currentMode === 'qa') {
      startMorphingTo(normalizedScores);
    } else {
      // Update immediately in other modes
      currentMBTIValues = normalizedScores;
      currentFaceParams = calculateFaceParametersFromMBTI(currentMBTIValues);
      updateParameterDisplay();

      // Update global references
      FaceApp.currentMBTIValues = currentMBTIValues;
      FaceApp.currentFaceParams = currentFaceParams;
    }
  }

  /**
   * Updates the UI description text
   * @param {string} text - New description text
   */
  function updateUIDescription(text) {
    const descElement = document.getElementById('uiDescription');
    if (descElement) {
      descElement.textContent = text;
    }
  }

  /**
   * Updates the mode indicator
   * @param {string} mode - Current mode
   */
  function updateModeIndicator(mode) {
    const modeElement = document.getElementById('modeIndicator');
    if (modeElement) {
      modeElement.textContent = `Mode: ${mode}`;
    }
  }



  /**
   * Sets up UI event handlers
   */
  function setupUIHandlers() {
    // Setup reset chat button
    document.getElementById('resetChatBtn').onclick = () => {
      if (chatUI) {
        chatUI.reset();
        currentMode = 'chat';
        updateUIDescription('Chat with Pablo to create your portrait');
        updateModeIndicator('Chat - Talk to Pablo');
        portraitSize = CONFIG.CANVAS.SIZE_RATIO;
      }
    };
  }

  /**
   * Starts morphing animation to new MBTI values
   * @param {Array} targetValues - Target MBTI values to morph to
   */
  function startMorphingTo(targetValues) {
    morphStartValues = [...currentMBTIValues];
    morphTarget = [...targetValues];
    morphStartTime = millis();

    console.log('Starting morph from', morphStartValues, 'to', morphTarget);
  }

  /**
   * Updates morphing animation and returns current interpolated values
   */
  function updateMorphing() {
    if (!morphTarget) return;

    const currentTime = millis();
    const elapsed = currentTime - morphStartTime;
    const progress = Math.min(elapsed / morphDuration, 1);

    // Use easing function for smooth animation
    const easedProgress = easeOutCubic(progress);

    // Interpolate between start and target values
    const interpolatedValues = morphStartValues.map((start, i) => {
      const target = morphTarget[i];
      return start + (target - start) * easedProgress;
    });

    // Update current values
    currentMBTIValues = interpolatedValues;
    currentFaceParams = calculateFaceParametersFromMBTI(currentMBTIValues);
    updateParameterDisplay();

    // Update global references
    FaceApp.currentMBTIValues = currentMBTIValues;
    FaceApp.currentFaceParams = currentFaceParams;

    // Check if morphing is complete
    if (progress >= 1) {
      morphTarget = null;
      morphStartValues = null;
      console.log('Morph complete at values:', currentMBTIValues);
    }
  }

  /**
   * Easing function for smooth morphing animation
   * @param {number} t - Progress value 0-1
   * @returns {number} Eased value 0-1
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Handles MBTI value changes from the slider UI
   * @param {Array} mbtiValues - Array of 4 MBTI values [e_i, s_n, t_f, j_p] each in [-1, 1]
   */
  function handleMBTIChange(mbtiValues) {
    // Stop any ongoing morphing when user manually adjusts
    morphTarget = null;
    morphStartValues = null;

    currentMBTIValues = mbtiValues;
    currentFaceParams = calculateFaceParametersFromMBTI(currentMBTIValues);
    updateParameterDisplay();

    // Update global references
    FaceApp.currentMBTIValues = currentMBTIValues;
    FaceApp.currentFaceParams = currentFaceParams;
  }  /**
   * Updates the parameter display in the UI
   */
  function updateParameterDisplay() {
    Object.keys(currentFaceParams).forEach(param => {
      const element = document.getElementById(`param-${param}`);
      if (element) {
        const value = currentFaceParams[param];
        if (typeof value === 'number' && !isNaN(value)) {
          element.textContent = value.toFixed(2);
        } else {
          element.textContent = '0.00';
        }
      }
    });
  }

  /**
   * Generates face based on MBTI parameters
   * Maps score parameters to actual face variations from JSON files
   * @param {Object} faceParams - Calculated face parameters from MBTI values
   * @returns {Object} Blended face data from multiple face files
   */
  function generateMBTIFace(faceParams) {
    if (!faceSets.length) return null;

    const faceCount = faceSets.length;

    return {
      head: getFeatureFromScore(faceParams.head || 0, 'head', faceCount),
      left_eye: getFeatureFromScore(faceParams.eye || 0, 'left_eye', faceCount),
      right_eye: getFeatureFromScore(faceParams.eye || 0, 'right_eye', faceCount),
      mouth: getFeatureFromScore(faceParams.mouth || 0, 'mouth', faceCount)
    };
  }

  /**
   * Maps a score to a morphed feature by blending between adjacent face files
   * @param {number} score - Score parameter (-1 to +1, where -1 = face_1, +1 = face_N)
   * @param {string} featureName - Name of the feature ('head', 'left_eye', 'right_eye', 'mouth')
   * @param {number} faceCount - Number of available face files
   * @returns {Array} Morphed points for the feature
   */
  function getFeatureFromScore(score, featureName, faceCount) {
    // Clamp score to [-1, 1] range
    const clampedScore = Math.max(-1, Math.min(1, score));

    // Map score [-1, 1] to continuous face index [0, faceCount-1]
    const normalizedScore = (clampedScore + 1) / 2; // Convert [-1,1] to [0,1]
    const continuousIndex = normalizedScore * (faceCount - 1);

    // Get the two adjacent face indices for blending
    const lowerIndex = Math.floor(continuousIndex);
    const upperIndex = Math.min(lowerIndex + 1, faceCount - 1);
    const blendFactor = continuousIndex - lowerIndex;

    // If we're exactly on a face index, return that face directly
    if (blendFactor === 0 || lowerIndex === upperIndex) {
      const selectedFace = faceSets[lowerIndex];
      return selectedFace ? selectedFace[featureName] || [] : [];
    }

    // Get the features from both faces
    const lowerFace = faceSets[lowerIndex];
    const upperFace = faceSets[upperIndex];

    if (!lowerFace || !upperFace) return [];

    const lowerFeature = lowerFace[featureName] || [];
    const upperFeature = upperFace[featureName] || [];

    // Blend the features using safe morphing
    return morphFeaturePoints(lowerFeature, upperFeature, blendFactor);
  }

  /**
   * Safely morphs between two sets of feature points with different point counts
   * @param {Array} points1 - First set of points
   * @param {Array} points2 - Second set of points  
   * @param {number} factor - Blend factor (0 = points1, 1 = points2)
   * @returns {Array} Morphed points
   */
  function morphFeaturePoints(points1, points2, factor) {
    if (!points1.length && !points2.length) return [];
    if (!points1.length) return [...points2];
    if (!points2.length) return [...points1];
    if (factor <= 0) return [...points1];
    if (factor >= 1) return [...points2];

    // Determine target point count (use the maximum for smoother morphing)
    const targetCount = Math.max(points1.length, points2.length);

    // Resample both point arrays to have the same number of points
    const resampledPoints1 = resamplePoints(points1, targetCount);
    const resampledPoints2 = resamplePoints(points2, targetCount);

    // Blend the resampled points
    return resampledPoints1.map((p1, i) => {
      const p2 = resampledPoints2[i];
      return {
        x: p1.x + (p2.x - p1.x) * factor,
        y: p1.y + (p2.y - p1.y) * factor
      };
    });
  }

  /**
   * Resamples a polyline to have a specific number of points
   * @param {Array} points - Original points
   * @param {number} targetCount - Desired number of points
   * @returns {Array} Resampled points
   */
  function resamplePoints(points, targetCount) {
    if (points.length === 0) return [];
    if (points.length === targetCount) return [...points];
    if (targetCount === 1) return [{ ...points[0] }];

    const result = [];

    // Calculate total path length
    let totalLength = 0;
    const segmentLengths = [];

    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(length);
      totalLength += length;
    }

    // Handle closed shapes by adding distance back to first point
    if (points.length > 2) {
      const dx = points[0].x - points[points.length - 1].x;
      const dy = points[0].y - points[points.length - 1].y;
      const closingLength = Math.sqrt(dx * dx + dy * dy);
      segmentLengths.push(closingLength);
      totalLength += closingLength;
    }

    if (totalLength === 0) {
      // All points are the same, return copies
      return Array(targetCount).fill().map(() => ({ ...points[0] }));
    }

    // Sample points at even intervals along the path
    for (let i = 0; i < targetCount; i++) {
      const targetDistance = (i / (targetCount - 1)) * totalLength;
      const point = getPointAtDistance(points, segmentLengths, targetDistance, totalLength);
      result.push(point);
    }

    return result;
  }

  /**
   * Gets a point at a specific distance along a polyline path
   * @param {Array} points - The polyline points
   * @param {Array} segmentLengths - Pre-calculated segment lengths
   * @param {number} targetDistance - Distance along path
   * @param {number} totalLength - Total path length
   * @returns {Object} Point at the target distance
   */
  function getPointAtDistance(points, segmentLengths, targetDistance, totalLength) {
    if (targetDistance <= 0) return { ...points[0] };
    if (targetDistance >= totalLength) return { ...points[0] }; // Loop back to start for closed shapes

    let currentDistance = 0;

    for (let i = 0; i < segmentLengths.length; i++) {
      const segmentEnd = currentDistance + segmentLengths[i];

      if (targetDistance <= segmentEnd) {
        // Point is within this segment
        const segmentProgress = (targetDistance - currentDistance) / segmentLengths[i];

        const p1 = points[i];
        const p2 = i + 1 < points.length ? points[i + 1] : points[0]; // Handle wrap-around

        return {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress
        };
      }

      currentDistance = segmentEnd;
    }

    // Fallback (shouldn't reach here)
    return { ...points[0] };
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

    // Update morphing animation if active
    updateMorphing();

    // Clear canvas and graphics buffer
    background(CONFIG.CANVAS.BACKGROUND_COLOR);
    pg.clear();

    // Calculate rendering parameters based on current mode
    const baseSize = Math.min(width, height) * portraitSize;
    const size = baseSize;

    // Position portrait consistently regardless of mode
    // Calculate position based on iPhone placement to ensure good centering
    const iphoneRight = CONFIG.CHAT.IPHONE.POSITION.RIGHT_MARGIN + CONFIG.CHAT.IPHONE.WIDTH;
    const availableWidth = width - iphoneRight;

    let cx, cy;
    if (currentMode === 'qa' || currentMode === 'chat') {
      // Position portrait in the available space to the left of the iPhone
      cx = availableWidth / 2; // Center in available left space
      cy = height / 2 + (height * CONFIG.CHAT.PORTRAIT.POSITION.VERTICAL_CENTER_OFFSET_RATIO);
    } else {
      // Keep same position for consistency
      cx = availableWidth / 2; // Same position as QA mode
      cy = height / 2 + (height * CONFIG.CHAT.PORTRAIT.POSITION.VERTICAL_CENTER_OFFSET_RATIO);
    }

    // Get face data based on current MBTI parameters
    const facePoints = generateMBTIFace(currentFaceParams);

    // Skip rendering if no face points generated
    if (!facePoints) {
      return;
    }

    // Apply organic animation to head outline if enabled
    const movementStrength = (currentFaceParams.movement || 0) * 0.5 + 0.5; // Convert [-1,1] to [0,1]
    const points = {
      head: CONFIG.ANIMATION.ORGANIC_NOISE.ENABLED
        ? addOrganicNoise(facePoints.head, millis(), movementStrength)
        : facePoints.head,
      left_eye: facePoints.left_eye,
      right_eye: facePoints.right_eye,
      mouth: facePoints.mouth
    };

    // Render the complete face
    composeFace(pg, points, cx, cy, size);
    image(pg, 0, 0);
  };

  /**
   * Adds organic noise animation to points for natural movement
   * @param {Array} points - Array of points to animate
   * @param {number} time - Current time in milliseconds
   * @param {number} movementMultiplier - Multiplier for movement strength (0 to 1)
   * @returns {Array} Points with organic noise applied
   */
  function addOrganicNoise(points, time, movementMultiplier = 1) {
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

      // Apply noise with configurable strength and movement multiplier
      const finalStrength = config.STRENGTH * movementMultiplier;
      return {
        x: p.x + offsetX * finalStrength,
        y: p.y + offsetY * finalStrength
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

  // Debug function to test the system
  window.debugMBTI = function () {
    console.log('=== MBTI System Debug ===');
    console.log('Face sets loaded:', faceSets.length);
    console.log('Current MBTI values:', currentMBTIValues);
    console.log('Current face params:', currentFaceParams);
    console.log('MBTI UI exists:', !!mbtiUI);

    if (faceSets.length > 0) {
      console.log('Sample face set:', faceSets[0]);
    }
  };

  // Expose globals for phone slider access
  FaceApp.currentMBTIValues = currentMBTIValues;
  FaceApp.currentFaceParams = currentFaceParams;
  window.handleMBTIChange = handleMBTIChange;

})(window);
