/**
 * Main Application Controller
 * Coordinates all modules and handles the main application logic
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * Main Application class that coordinates all modules
   */
  class PortraitApp {
    constructor() {
      // Initialize modules
      this.appState = new FaceApp.AppState();
      this.faceGenerator = new FaceApp.FaceGenerator(this.appState);
      this.canvasManager = new FaceApp.CanvasManager(this.appState);
      this.animationController = new FaceApp.AnimationController();

      // UI components
      this.chatUI = null;
      this.mbtiUI = null;

  // Animation state
  this.mbtiAnimationProgress = null;
  this.morphTimeout = null;
  // Timeout used to schedule the actual start of the shape morph (start delay)
  this.morphStartTimeout = null;
      this.currentShapeIndices = null; // Tracks last rendered discrete indices

      // Bind methods
      this.handleMBTIChange = this.handleMBTIChange.bind(this);
      this.handleWorkflowChange = this.handleWorkflowChange.bind(this);
      this.handleChatMBTIUpdate = this.handleChatMBTIUpdate.bind(this);
      this.handleOrientationChange = this.handleOrientationChange.bind(this);
      this.handleKeyPress = this.handleKeyPress.bind(this);

      // Set up state listeners
      this.setupStateListeners();
    }

    /**
     * Initialize the application
     */
    async initialize() {
      console.log('Initializing Portrait App...');

      // Initialize canvas
      this.canvasManager.initialize(windowWidth, windowHeight);

      // Load face data
      await this.faceGenerator.loadFaceData();

      // Initialize MBTI system
      this.appState.updateMBTI(CONFIG.MBTI.DEFAULT_VALUES);

      // Initialize animation controller with initial shapes
      const initialShapes = this.appState.generateCurrentFaceShapes();
      this.animationController.setInitialShapes(initialShapes);
      // Record initial discrete indices for change detection
      if (this.appState.isDataLoaded) {
        this.currentShapeIndices = this.faceGenerator.getShapeIndices(
          this.appState.faceParams,
          this.appState.faceSets.length
        );
      }

      // Setup UI components
      this.setupUI();

      // Update global references for backward compatibility
      this.updateGlobalReferences();

      console.log('Portrait App initialized successfully');
    }

    /**
     * Set up state change listeners
     */
    setupStateListeners() {
      this.appState.on('mbti-changed', (data) => {
        this.updateParameterDisplay();
        this.handleShapeUpdate(data.faceParams);
        this.updateGlobalReferences();
      });

      this.appState.on('mode-changed', (data) => {
        this.updateModeIndicator(data.newMode);
      });

      this.appState.on('orientation-changed', (data) => {
        if (this.chatUI) {
          this.chatUI.handleOrientationChange();
        }
      });
    }

    /**
     * Set up UI components
     */
    setupUI() {
      // Initialize chat UI
      setTimeout(() => {
        this.initializeChatUI();
        this.updateModeIndicator('Chat - Talk to Pablo');
      }, 100);

      // Setup event handlers
      this.setupEventHandlers();
    }

    /**
     * Initialize Chat UI
     */
    initializeChatUI() {
      const container = document.getElementById('chatContainer');
      if (!container) {
        console.error('Chat container not found!');
        return;
      }

      this.chatUI = new FaceApp.ChatUI('chatContainer', this.handleWorkflowChange, this.handleChatMBTIUpdate);
      console.log('Chat UI initialized');
    }

    /**
     * Set up event handlers
     */
    setupEventHandlers() {
      // Reset chat button
      const resetBtn = document.getElementById('resetChatBtn');
      if (resetBtn) {
        resetBtn.onclick = () => {
          if (this.chatUI) {
            this.chatUI.reset();
            this.appState.updateMode('chat');
            this.updateUIDescription('Chat with Pablo to create your portrait');
            this.updateModeIndicator('Chat - Talk to Pablo');
            this.appState.portraitSize = CONFIG.CANVAS.SIZE_RATIO;
          }
        };
      }

      // Randomize button
      const randomBtn = document.getElementById('randomBtn');
      if (randomBtn) {
        randomBtn.onclick = () => {
          this.randomizeMBTI();
        };
      }
    }

    /**
     * Handle workflow changes from chat interface
     * @param {string} workflow - 'qa' for Q&A mode, 'self' for self-adjustment mode
     */
    handleWorkflowChange(workflow) {
      console.log('Workflow changed to:', workflow);

      if (workflow === 'qa') {
        this.appState.updateMode('qa');
        this.updateUIDescription('Answer Pablo\'s questions to build your portrait');
        this.updateModeIndicator('Q&A - Answer Pablo\'s questions');
        this.appState.portraitSize = CONFIG.CANVAS.SIZE_RATIO;
      } else if (workflow === 'self') {
        this.appState.updateMode('self');
        this.updateUIDescription('Use the sliders on the phone to adjust your portrait');
        this.updateModeIndicator('Self-adjustment - Use phone sliders');
        this.appState.portraitSize = CONFIG.CANVAS.SIZE_RATIO;
      }
    }

    /**
     * Handle MBTI updates from chat Q&A
     * @param {Array} mbtiScores - Raw accumulated scores from chat
     */
    handleChatMBTIUpdate(mbtiScores) {
      console.log('Chat MBTI update:', mbtiScores);

      // Normalize scores to [-1, 1] range
      const normalizedScores = mbtiScores.map(score => {
        const scaled = score * 1.0;
        return Math.max(-1, Math.min(1, scaled));
      });

      // In QA mode we want immediate visible response but still optionally
      // run a smoothing animation. Update MBTI immediately so shapes can
      // start reacting, then schedule the smoothing animation which uses
      // CONFIG.ANIMATION.MORPH.DURATION_SEC for duration only.
      if (this.appState.mode === 'qa') {
        // Apply MBTI immediately for instant feedback
        this.appState.updateMBTI(normalizedScores);

        // Then start morphing-to (this will interpolate MBTI over DURATION_SEC)
        // but we also schedule startShapeMorphing after CONFIG.ANIMATION.MORPH.START_DELAY_SEC
        this.startMorphingTo(normalizedScores);
      } else {
        // Update immediately in other modes
        this.appState.updateMBTI(normalizedScores);
      }
    }

    /**
     * Handle MBTI slider changes
     * @param {Array} mbtiValues - New MBTI values from sliders
     */
    handleMBTIChange(mbtiValues) {
      // Stop any ongoing MBTI morphing when user manually adjusts
      if (this.mbtiAnimationProgress) {
        anime.remove(this.mbtiAnimationProgress);
        this.mbtiAnimationProgress = null;
      }

      this.appState.updateMBTI(mbtiValues);
    }

    /**
     * Handle shape updates triggered by MBTI changes
     * @param {Object} faceParams - New face parameters
     */
    handleShapeUpdate(faceParams) {
      // Performance optimization: only update if data is loaded
      if (!this.appState.isDataLoaded) return;

      const newShapes = this.appState.generateCurrentFaceShapes();
      if (newShapes) {
        this.debouncedShapeMorph(newShapes, faceParams);
      }
    }

    /**
     * Start morphing to new MBTI values
     * @param {Array} targetValues - Target MBTI values
     */
    startMorphingTo(targetValues) {
      // Stop any existing MBTI animation
      if (this.mbtiAnimationProgress) {
        anime.remove(this.mbtiAnimationProgress);
      }

      const startValues = [...this.appState.mbti];

      // Create anime.js animation for MBTI values
      this.mbtiAnimationProgress = { value: 0 };
      anime({
        targets: this.mbtiAnimationProgress,
        value: 1,
        duration: CONFIG.ANIMATION.MORPH.DURATION_SEC * 1000,
        easing: 'easeOutCubic',
        update: () => {
          const progress = this.mbtiAnimationProgress.value;
          const interpolatedValues = startValues.map((start, i) => {
            const target = targetValues[i];
            return start + (target - start) * progress;
          });
          this.appState.updateMBTI(interpolatedValues);
        },
        complete: () => {
          this.mbtiAnimationProgress = null;
          console.log('MBTI morph complete at values:', this.appState.mbti);
        }
      });

      // Schedule the actual shape morph start after START_DELAY_SEC (separate from DURATION_SEC)
      // Clear any existing scheduled morph start
      if (this.morphStartTimeout) {
        clearTimeout(this.morphStartTimeout);
        this.morphStartTimeout = null;
      }

      const startDelay = (CONFIG.ANIMATION.MORPH.START_DELAY_SEC || 0) * 1000;
      if (startDelay > 0) {
        this.morphStartTimeout = setTimeout(() => {
          // Cancel any pending debounced morph so we start deterministically
          if (this.morphTimeout) {
            clearTimeout(this.morphTimeout);
            this.morphTimeout = null;
          }

          // Compute the new shapes from the (already-updated) appState faceParams
          const newShapes = this.appState.generateCurrentFaceShapes();
          const newParams = this.appState.faceParams;
          if (newShapes) {
            this.startShapeMorphing(newShapes, newParams);
          }
          this.morphStartTimeout = null;
        }, startDelay);
      } else {
        // If no start delay configured, start immediately
        // Cancel any pending debounced morph to avoid delay
        if (this.morphTimeout) {
          clearTimeout(this.morphTimeout);
          this.morphTimeout = null;
        }
        const newShapes = this.appState.generateCurrentFaceShapes();
        const newParams = this.appState.faceParams;
        if (newShapes) {
          this.startShapeMorphing(newShapes, newParams);
        }
      }

      console.log('Starting MBTI morph from', startValues, 'to', targetValues);
    }

    /**
     * Debounced shape morphing
     * @param {Object} newShapes - Target shapes
     * @param {Object} newParams - Face parameters
     */
    debouncedShapeMorph(newShapes, newParams) {
      if (this.morphTimeout) {
        clearTimeout(this.morphTimeout);
      }

      this.morphTimeout = setTimeout(() => {
        this.startShapeMorphing(newShapes, newParams);
      }, 100);
    }

    /**
     * Start shape morphing using animation controller
     * @param {Object} newShapes - Target shapes
     * @param {Object} newParams - Face parameters
     */
    startShapeMorphing(newShapes, newParams) {
      // Compute new discrete indices from incoming params
      const newIndices = this.faceGenerator.getShapeIndices(newParams, this.appState.faceSets.length);
      const currentIndices = this.currentShapeIndices;

      // If we don't have a baseline yet, proceed to morph
      if (currentIndices && JSON.stringify(currentIndices) === JSON.stringify(newIndices)) {
        console.log('Skipping morph - same discrete shape indices:', currentIndices);
        return;
      }

      // Use animation controller for smooth morphing
      this.animationController.morphTo(newShapes, null, () => {
        // Update last rendered indices upon completion
        this.currentShapeIndices = newIndices;
        console.log('Shape morph complete with indices:', newIndices);
      });

      console.log('Starting shape morph from indices:', currentIndices, 'to:', newIndices);
    }

    /**
     * Handle orientation changes
     */
    handleOrientationChange() {
      const newOrientation = this.canvasManager.isPortraitMode() ? 'portrait' : 'landscape';
      this.appState.updateOrientation(newOrientation);
    }

    /**
     * Handle window resize
     */
    handleResize() {
      this.canvasManager.handleResize();
      this.handleOrientationChange();
    }

    /**
     * Handle key press events
     * @param {string} key - Pressed key
     */
    handleKeyPress(key) {
      if (key.toLowerCase() === CONFIG.UI.SHORTCUTS.SAVE_KEY) {
        this.saveCanvas();
      }
    }

    /**
     * Save canvas area
     */
    saveCanvas() {
      const currentShapes = this.animationController.getCurrentShapes();
      this.canvasManager.saveCanvasArea(currentShapes, this.addOrganicNoise.bind(this));
    }

    /**
     * Randomize MBTI values
     */
    randomizeMBTI() {
      const randomValues = Array.from({ length: 4 }, () => (Math.random() - 0.5) * 2);
      this.appState.updateMBTI(randomValues);
    }

    /**
     * Main render loop
     */
    draw() {
      // Skip rendering if face data hasn't loaded yet
      if (!this.appState.isDataLoaded) {
        return;
      }

      // Clear canvas
      this.canvasManager.clearCanvas();

      // Calculate canvas positioning
      const canvasInfo = this.canvasManager.calculateCanvasPosition();
      const { cx, cy, canvasSize } = canvasInfo;

      // Get current face shapes
      const facePoints = this.animationController.getCurrentShapes();
      if (!facePoints) {
        return;
      }

      // Apply organic animation
      const movementStrength = (this.appState.faceParams.movement || 0) * 0.5 + 0.5;
      const points = {
        head: CONFIG.ANIMATION.ORGANIC_NOISE.ENABLED
          ? this.addOrganicNoise(facePoints.head, millis(), movementStrength)
          : facePoints.head,
        left_eye: facePoints.left_eye,
        right_eye: facePoints.right_eye,
        mouth: facePoints.mouth
      };

      // Render the face
      const pg = this.canvasManager.getGraphicsBuffer();
      FaceApp.Renderer.composeFace(pg, points, cx, cy, canvasSize);
      this.canvasManager.renderToCanvas();

      // Draw debug border if enabled
      this.canvasManager.drawDebugBorder(canvasInfo);
    }

    /**
     * Add organic noise to points for natural movement
     * @param {Array} points - Points to animate
     * @param {number} time - Current time
     * @param {number} movementMultiplier - Movement strength
     * @returns {Array} Animated points
     */
    addOrganicNoise(points, time, movementMultiplier = 1) {
      const config = CONFIG.ANIMATION.ORGANIC_NOISE;

      return points.map((p, i) => {
        const timeX = time * config.TIME_SPEED;
        const timeY = time * config.TIME_SPEED * config.TIME_OFFSET_Y;
        const uniqueOffset = i * config.UNIQUE_OFFSET;

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

        const finalStrength = config.STRENGTH * movementMultiplier;
        return {
          x: p.x + offsetX * finalStrength,
          y: p.y + offsetY * finalStrength
        };
      });
    }

    /**
     * Update parameter display in UI
     */
    updateParameterDisplay() {
      Object.keys(this.appState.faceParams).forEach(param => {
        const element = document.getElementById(`param-${param}`);
        if (element) {
          const value = this.appState.faceParams[param];
          element.textContent = (typeof value === 'number' && !isNaN(value))
            ? value.toFixed(2)
            : '0.00';
        }
      });
    }

    /**
     * Update UI description
     * @param {string} text - Description text
     */
    updateUIDescription(text) {
      const element = document.getElementById('uiDescription');
      if (element) {
        element.textContent = text;
      }
    }

    /**
     * Update mode indicator
     * @param {string} mode - Current mode
     */
    updateModeIndicator(mode) {
      const element = document.getElementById('modeIndicator');
      if (element) {
        element.textContent = `Mode: ${mode}`;
      }
    }

    /**
     * Update global references for backward compatibility
     */
    updateGlobalReferences() {
      FaceApp.currentMBTIValues = this.appState.mbti;
      FaceApp.currentFaceParams = this.appState.faceParams;
      FaceApp.isPortraitMode = () => this.canvasManager.isPortraitMode();
    }
  }

  // Export the main app
  FaceApp.PortraitApp = PortraitApp;
})(window);
