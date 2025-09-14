/**
 * Central State Management
 * Single source of truth for all application state
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * AppState class manages all application state and notifications
   */
  class AppState {
    constructor() {
      // Core state
      this.mbti = [...CONFIG.MBTI.DEFAULT_VALUES]; // [e_i, s_n, t_f, j_p]
      this.faceParams = {};
      this.currentShapes = null;
      this.mode = 'chat'; // 'chat', 'qa', 'self'
      this.orientation = 'landscape'; // 'portrait', 'landscape'
      this.portraitSize = CONFIG.CANVAS.SIZE_RATIO;

      // Data
      this.faceSets = [];
      this.isDataLoaded = false;

      // Event listeners
      this.listeners = {};

      // Performance optimization: cache for face shapes
      this.shapeCache = new Map();
      this.lastShapeIndices = null;
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit event to all listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
    }

    /**
     * Update MBTI values and calculate face parameters
     * @param {Array} newValues - New MBTI values
     */
    updateMBTI(newValues) {
      this.mbti = [...newValues];
      this.faceParams = this.calculateFaceParameters();
      // Invalidate cache so fresh shapes are generated for new params
      this.lastShapeIndices = null;
      this.emit('mbti-changed', {
        mbti: this.mbti,
        faceParams: this.faceParams
      });
    }

    /**
     * Update current mode
     * @param {string} newMode - New mode ('chat', 'qa', 'self')
     */
    updateMode(newMode) {
      const oldMode = this.mode;
      this.mode = newMode;
      this.emit('mode-changed', {
        oldMode,
        newMode
      });
    }

    /**
     * Update orientation
     * @param {string} newOrientation - New orientation ('portrait', 'landscape')
     */
    updateOrientation(newOrientation) {
      const oldOrientation = this.orientation;
      this.orientation = newOrientation;
      this.emit('orientation-changed', {
        oldOrientation,
        newOrientation
      });
    }

    /**
     * Set face data
     * @param {Array} faceSets - Loaded face data
     */
    setFaceData(faceSets) {
      this.faceSets = faceSets;
      this.isDataLoaded = true;
      this.emit('data-loaded', { faceSets });
    }

    /**
     * Calculate face parameters from current MBTI values
     * @returns {Object} Calculated face parameters
     */
    calculateFaceParameters() {
      const params = {};

      // Calculate each feature parameter using weighted sum
      Object.keys(CONFIG.MBTI.FEATURE_WEIGHTS).forEach(feature => {
        const weights = CONFIG.MBTI.FEATURE_WEIGHTS[feature];
        let value = 0;

        // Only add weights that exist for this feature
        if (weights.e_i !== undefined) value += weights.e_i * this.mbti[0];  // E/I dimension
        if (weights.s_n !== undefined) value += weights.s_n * this.mbti[1];  // S/N dimension  
        if (weights.t_f !== undefined) value += weights.t_f * this.mbti[2];  // T/F dimension
        if (weights.j_p !== undefined) value += weights.j_p * this.mbti[3];  // J/P dimension

        params[feature] = value;
      });

      return params;
    }

    /**
     * Generate face shapes from current face parameters with caching
     * @returns {Object} Generated face shapes
     */
    generateCurrentFaceShapes() {
      if (!this.isDataLoaded) return null;

      const faceCount = this.faceSets.length;

      // Create cache key from current shape indices
      const shapeIndices = this.getShapeIndices();
      const cacheKey = JSON.stringify(shapeIndices);

      // Return cached result if available
      if (this.shapeCache.has(cacheKey)) {
        return this.shapeCache.get(cacheKey);
      }

      // Generate new shapes
      const shapes = {
        head: this.getFeatureFromScore(this.faceParams.head || 0, 'head', faceCount),
        left_eye: this.getFeatureFromScore(this.faceParams.eye || 0, 'left_eye', faceCount),
        right_eye: this.getFeatureFromScore(this.faceParams.eye || 0, 'right_eye', faceCount),
        mouth: this.getFeatureFromScore(this.faceParams.mouth || 0, 'mouth', faceCount)
      };

      // Cache the result
      this.shapeCache.set(cacheKey, shapes);
      // Update last used indices for external consumers (debug/change detection)
      this.lastShapeIndices = shapeIndices;

      // Keep cache size reasonable
      if (this.shapeCache.size > 50) {
        const firstKey = this.shapeCache.keys().next().value;
        this.shapeCache.delete(firstKey);
      }

      return shapes;
    }

    /**
     * Get shape indices for current face parameters
     * @returns {Object} Shape indices for each feature
     */
    getShapeIndices() {
      const faceCount = this.faceSets.length;
      const indices = {};

      ['head', 'eye', 'mouth'].forEach(feature => {
        const score = this.faceParams[feature] || 0;
        const clampedScore = Math.max(-1, Math.min(1, score));
        const normalizedScore = (clampedScore + 1) / 2;
        const segmentSize = 1.0 / faceCount;
        let selectedIndex = Math.floor(normalizedScore / segmentSize);
        if (selectedIndex >= faceCount) selectedIndex = faceCount - 1;
        indices[feature] = selectedIndex;
      });

      return indices;
    }

    /**
     * Maps a score to a feature by selecting from face files
     * @param {number} score - Score parameter (-1 to +1)
     * @param {string} featureName - Name of the feature
     * @param {number} faceCount - Number of available face files
     * @returns {Array} Selected feature points
     */
    getFeatureFromScore(score, featureName, faceCount) {
      // Clamp score to [-1, 1] range
      const clampedScore = Math.max(-1, Math.min(1, score));

      // Map score [-1, 1] to discrete face index [0, faceCount-1]
      const normalizedScore = (clampedScore + 1) / 2; // Convert [-1,1] to [0,1]

      // Divide the score range into equal segments for each face
      const segmentSize = 1.0 / faceCount;
      let selectedIndex = Math.floor(normalizedScore / segmentSize);

      // Handle edge case where score is exactly 1.0
      if (selectedIndex >= faceCount) {
        selectedIndex = faceCount - 1;
      }

      // Return the selected face feature directly
      const selectedFace = this.faceSets[selectedIndex];
      return selectedFace ? selectedFace[featureName] || [] : [];
    }

    /**
     * Get current state snapshot
     * @returns {Object} Current state
     */
    getState() {
      return {
        mbti: [...this.mbti],
        faceParams: { ...this.faceParams },
        currentShapes: this.currentShapes,
        mode: this.mode,
        orientation: this.orientation,
        portraitSize: this.portraitSize,
        isDataLoaded: this.isDataLoaded
      };
    }
  }

  // Export the AppState
  FaceApp.AppState = AppState;
})(window);
