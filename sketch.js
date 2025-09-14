/**
 * p5.js Integration Layer
 * Minimal wrapper that bridges p5.js with the modular Portrait App
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  // Main application instance
  let portraitApp;

  /**
   * p5.js setup function - initializes the Portrait App
   */
  window.setup = async function () {
    // Create and initialize the main Portrait App
    portraitApp = new FaceApp.PortraitApp();
    await portraitApp.initialize();
  };

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
  }

  /**
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

      // Generate new target shapes and start morphing
      const newShapes = generateMBTIFace(currentFaceParams);
      debouncedShapeMorph(newShapes, currentFaceParams);

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
    // Stop any existing MBTI animation
    if (mbtiAnimationProgress) {
      anime.remove(mbtiAnimationProgress);
    }

    mbtiAnimationStart = [...currentMBTIValues];
    mbtiAnimationTarget = [...targetValues];
    mbtiAnimationStartTime = millis();

    // Create anime.js animation for MBTI values
    mbtiAnimationProgress = { value: 0 };
    anime({
      targets: mbtiAnimationProgress,
      value: 1,
      duration: CONFIG.ANIMATION.MORPH.DURATION_SEC * 1000,
      easing: 'easeOutCubic',
      update: () => {
        updateMBTIAnimation();
      },
      complete: () => {
        mbtiAnimationTarget = null;
        mbtiAnimationStart = null;
        mbtiAnimationProgress = null;
        console.log('MBTI morph complete at values:', currentMBTIValues);
      }
    });

    console.log('Starting MBTI morph from', mbtiAnimationStart, 'to', mbtiAnimationTarget);
  }

  /**
   * Updates MBTI animation and triggers shape morphing
   */
  function updateMBTIAnimation() {
    if (!mbtiAnimationTarget || !mbtiAnimationStart) return;

    const progress = mbtiAnimationProgress.value;

    // Interpolate MBTI values
    currentMBTIValues = mbtiAnimationStart.map((start, i) => {
      const target = mbtiAnimationTarget[i];
      return start + (target - start) * progress;
    });

    // Update face parameters
    currentFaceParams = calculateFaceParametersFromMBTI(currentMBTIValues);
    updateParameterDisplay();

    // Generate new shapes and trigger smooth morphing
    const newShapes = generateMBTIFace(currentFaceParams);
    debouncedShapeMorph(newShapes, currentFaceParams);

    // Update global references
    FaceApp.currentMBTIValues = currentMBTIValues;
    FaceApp.currentFaceParams = currentFaceParams;
  }



  /**
   * Handles MBTI value changes from the slider UI
   * @param {Array} mbtiValues - Array of 4 MBTI values [e_i, s_n, t_f, j_p] each in [-1, 1]
   */
  function handleMBTIChange(mbtiValues) {
    // Stop any ongoing MBTI morphing when user manually adjusts
    morphTarget = null;
    morphStartValues = null;

    // Record the time of this change for debouncing
    lastMBTIChangeTime = millis();

    currentMBTIValues = mbtiValues;
    currentFaceParams = calculateFaceParametersFromMBTI(currentMBTIValues);
    updateParameterDisplay();

    // Generate new target shapes and start morphing
    const newShapes = generateMBTIFace(currentFaceParams);
    console.log('MBTI Change - Face params:', currentFaceParams);
    console.log('MBTI Change - Generated shapes for indices:',
      getShapeIndices(currentFaceParams, faceSets.length));

    // Start morphing based on parameter changes
    debouncedShapeMorph(newShapes, currentFaceParams);

    // Update global references
    FaceApp.currentMBTIValues = currentMBTIValues;
    FaceApp.currentFaceParams = currentFaceParams;
  }

  /**
   * Helper function to show which shape indices are selected for debugging
   */
  function getShapeIndices(faceParams, faceCount) {
    const indices = {};
    ['head', 'eye', 'mouth'].forEach(feature => {
      const score = faceParams[feature] || 0;
      const clampedScore = Math.max(-1, Math.min(1, score));
      const normalizedScore = (clampedScore + 1) / 2;
      const segmentSize = 1.0 / faceCount;
      let selectedIndex = Math.floor(normalizedScore / segmentSize);
      if (selectedIndex >= faceCount) selectedIndex = faceCount - 1;
      indices[feature] = selectedIndex;
    });
    return indices;
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
   * @returns {Object} Discrete face data from JSON files
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
   * Gets the current face shapes to display from the animation controller
   * @returns {Object} Current face shapes (either static or morphed)
   */
  function getCurrentDisplayShapes() {
    return animationController.getCurrentShapes();
  }

  /**
   * Debounced shape morphing to prevent jittering from rapid changes
   * @param {Object} newShapes - Target face shapes to morph to
   * @param {Object} newParams - Face parameters that generated the new shapes
   */
  function debouncedShapeMorph(newShapes, newParams) {
    // Clear any pending morph
    if (morphTimeout) {
      clearTimeout(morphTimeout);
    }

    // Schedule new morph after debounce delay
    morphTimeout = setTimeout(() => {
      startShapeMorphingWithController(newShapes, newParams);
    }, 100); // Reduced debounce since anime.js handles smoothness better
  }

  /**
   * Starts shape morphing animation using the animation controller
   * @param {Object} newShapes - Target face shapes to morph to
   * @param {Object} newParams - Face parameters that generated the new shapes
   */
  function startShapeMorphingWithController(newShapes, newParams) {
    // Check if the discrete shape selections have actually changed by comparing shape indices
    const currentIndices = getShapeIndices(currentFaceParams || {}, faceSets.length);
    const newIndices = getShapeIndices(newParams, faceSets.length);

    const shapeIndicesChanged = JSON.stringify(currentIndices) !== JSON.stringify(newIndices);

    if (!shapeIndicesChanged) {
      console.log('Skipping morph - same discrete shape indices:', currentIndices);
      return;
    }

    // Use animation controller for smooth morphing
    animationController.morphTo(
      newShapes,
      null, // No update callback needed
      () => {
        // Update current face params when morph completes
        currentFaceParams = { ...newParams };
        console.log('Shape morph complete with indices:', newIndices);
      }
    );

    console.log('Starting shape morph from indices:', currentIndices, 'to:', newIndices);
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

    // Map score [-1, 1] to discrete face index [0, faceCount-1]
    const normalizedScore = (clampedScore + 1) / 2; // Convert [-1,1] to [0,1]

    // Divide the score range into equal segments for each face
    // For example, with 6 faces: 0-0.2 -> face 0, 0.2-0.4 -> face 1, etc.
    const segmentSize = 1.0 / faceCount;
    let selectedIndex = Math.floor(normalizedScore / segmentSize);

    // Handle edge case where score is exactly 1.0
    if (selectedIndex >= faceCount) {
      selectedIndex = faceCount - 1;
    }

    // Return the selected face feature directly (no blending)
    const selectedFace = faceSets[selectedIndex];
    return selectedFace ? selectedFace[featureName] || [] : [];
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
   * Check if we're in portrait mode (width < height)
   */
  function isPortraitMode() {
    return width < height;
  }

  /**
   * Calculate optimal canvas positioning for automatic centering
   */
  function calculateCanvasPosition() {
    const inPortraitMode = isPortraitMode();

    if (inPortraitMode) {
      // Portrait mode: canvas goes in top half of screen
      const topHalfHeight = height * CONFIG.CHAT.RESPONSIVE.CANVAS.TOP_HALF_HEIGHT_RATIO;
      const availableSize = Math.min(width, topHalfHeight);
      const canvasSize = availableSize * CONFIG.CHAT.RESPONSIVE.CANVAS.SIZE_RATIO;

      // Center horizontally in full width
      const cx = width / 2;

      // Center vertically in top half with optional offset
      const topHalfCenter = topHalfHeight / 2;
      const verticalOffset = topHalfHeight * CONFIG.CHAT.RESPONSIVE.CANVAS.VERTICAL_OFFSET;
      const cy = topHalfCenter + verticalOffset;

      return {
        cx,
        cy,
        canvasSize,
        isPortrait: true,
        // Calculate canvas bounds for debug border
        canvasLeft: cx - canvasSize / 2,
        canvasTop: cy - canvasSize / 2,
        canvasRight: cx + canvasSize / 2,
        canvasBottom: cy + canvasSize / 2
      };
    } else {
      // Landscape mode: original behavior with iPhone mockup
      const iphoneRight = CONFIG.CHAT.IPHONE.POSITION.RIGHT_MARGIN + CONFIG.CHAT.IPHONE.WIDTH;
      const availableWidth = width - iphoneRight;

      // Calculate canvas size (square, based on portrait size setting)
      const canvasSize = Math.min(availableWidth, height) * portraitSize;

      // Center horizontally in available space (between left edge and iPhone)
      const cx = availableWidth / 2;

      // Center vertically in viewport (no hardcoded offsets)
      const cy = height / 2;

      return {
        cx,
        cy,
        canvasSize,
        isPortrait: false,
        // Calculate canvas bounds for debug border
        canvasLeft: cx - canvasSize / 2,
        canvasTop: cy - canvasSize / 2,
        canvasRight: cx + canvasSize / 2,
        canvasBottom: cy + canvasSize / 2
      };
    }
  }

  /**
   * Draw debug border around the canvas area if enabled
   */
  function drawDebugBorder(canvasInfo) {
    if (!CONFIG.CANVAS.DEBUG_BORDER.ENABLED) return;

    // Draw debug border using p5.js
    push();
    noFill();
    stroke(CONFIG.CANVAS.DEBUG_BORDER.COLOR);
    strokeWeight(CONFIG.CANVAS.DEBUG_BORDER.WIDTH);
    rectMode(CORNERS);
    rect(
      canvasInfo.canvasLeft,
      canvasInfo.canvasTop,
      canvasInfo.canvasRight,
      canvasInfo.canvasBottom
    );
    pop();
  }

  /**
   * p5.js draw function - delegates to the Portrait App
   */
  window.draw = function () {
    if (portraitApp) {
      portraitApp.draw();
    }
  };

  /**
   * Handles window resize events
   */
  window.windowResized = function () {
    if (portraitApp) {
      portraitApp.handleResize();
    }
  };

  /**
   * Handles keyboard input
   */
  window.keyPressed = function () {
    if (portraitApp) {
      portraitApp.handleKeyPress(key);
    }
  };

  // Expose backward compatibility function for phone slider access
  window.handleMBTIChange = function (mbtiValues) {
    if (portraitApp) {
      portraitApp.handleMBTIChange(mbtiValues);
    }
  };

})(window);
