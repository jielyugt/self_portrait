/**
 * Unified Animation Controller
 * Manages all morphing animations using anime.js for smooth easing
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * AnimationController class manages all face morphing animations
   */
  class AnimationController {
    constructor() {
      this.state = 'idle'; // 'idle', 'morphing'
      this.currentShapes = null;
      this.targetShapes = null;
      this.morphedShapes = null; // Intermediate morphed shapes
      this.animation = null; // Current anime.js animation
      this.onUpdateCallback = null;
      this.onCompleteCallback = null;

      // Animation progress (0 to 1)
      this.progress = { value: 1 };
    }

    /**
     * Sets the initial shapes
     * @param {Object} shapes - Initial face shapes
     */
    setInitialShapes(shapes) {
      this.currentShapes = this.deepCloneShapes(shapes);
      this.morphedShapes = this.deepCloneShapes(shapes);
    }

    /**
     * Starts morphing to new target shapes
     * @param {Object} targetShapes - Target face shapes to morph to
     * @param {Function} onUpdate - Callback called during animation updates
     * @param {Function} onComplete - Callback called when animation completes
     */
    morphTo(targetShapes, onUpdate = null, onComplete = null) {
      // If already morphing, update the target smoothly
      if (this.state === 'morphing' && this.animation) {
        this.targetShapes = this.deepCloneShapes(targetShapes);
        return;
      }

      // Set up new morph
      this.targetShapes = this.deepCloneShapes(targetShapes);
      this.onUpdateCallback = onUpdate;
      this.onCompleteCallback = onComplete;

      // Ensure we have current shapes
      if (!this.currentShapes) {
        this.currentShapes = this.deepCloneShapes(targetShapes);
        this.morphedShapes = this.deepCloneShapes(targetShapes);
        if (onComplete) onComplete();
        return;
      }

      // Start anime.js animation
      this.startAnimation();
    }

    /**
     * Starts the anime.js animation
     */
    startAnimation() {
      this.state = 'morphing';
      this.progress.value = 0;

      // Stop any existing animation
      if (this.animation) {
        this.animation.pause();
      }

      // Create smooth anime.js animation
      this.animation = anime({
        targets: this.progress,
        value: 1,
        duration: CONFIG.ANIMATION.MORPH.DURATION_SEC * 1000,
        easing: 'easeOutCubic',
        update: () => {
          this.updateMorphedShapes();
          if (this.onUpdateCallback) {
            this.onUpdateCallback(this.morphedShapes);
          }
        },
        complete: () => {
          this.completeAnimation();
        }
      });
    }

    /**
     * Updates the morphed shapes based on current progress
     */
    updateMorphedShapes() {
      if (!this.currentShapes || !this.targetShapes) return;

      const t = this.progress.value;
      this.morphedShapes = {};

      // Morph each feature
      ['head', 'left_eye', 'right_eye', 'mouth'].forEach(feature => {
        this.morphedShapes[feature] = this.morphFeaturePoints(
          this.currentShapes[feature] || [],
          this.targetShapes[feature] || [],
          t
        );
      });
    }

    /**
     * Completes the animation
     */
    completeAnimation() {
      this.state = 'idle';
      this.currentShapes = this.deepCloneShapes(this.targetShapes);
      this.morphedShapes = this.deepCloneShapes(this.targetShapes);
      this.progress.value = 1;
      this.animation = null;

      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.morphedShapes);
      }
    }

    /**
     * Gets the current display shapes (morphed or final)
     * @returns {Object} Current shapes to display
     */
    getCurrentShapes() {
      return this.morphedShapes || this.currentShapes;
    }

    /**
     * Checks if animation is currently running
     * @returns {boolean} True if morphing
     */
    isMorphing() {
      return this.state === 'morphing';
    }

    /**
     * Stops any current animation
     */
    stop() {
      if (this.animation) {
        this.animation.pause();
        this.animation = null;
      }
      this.state = 'idle';
    }

    /**
     * Deep clones face shapes object
     * @param {Object} shapes - Shapes to clone
     * @returns {Object} Cloned shapes
     */
    deepCloneShapes(shapes) {
      if (!shapes) return null;

      const cloned = {};
      ['head', 'left_eye', 'right_eye', 'mouth'].forEach(feature => {
        if (shapes[feature]) {
          cloned[feature] = shapes[feature].map(point => ({
            x: point.x,
            y: point.y
          }));
        }
      });
      return cloned;
    }

    /**
     * Morphs between two sets of feature points using optimized interpolation
     * Takes advantage of pre-normalized point counts for smooth morphing
     * @param {Array} points1 - First set of points
     * @param {Array} points2 - Second set of points  
     * @param {number} factor - Blend factor (0 = points1, 1 = points2)
     * @returns {Array} Morphed points
     */
    morphFeaturePoints(points1, points2, factor) {
      if (!points1.length && !points2.length) return [];
      if (!points1.length) return [...points2];
      if (!points2.length) return [...points1];
      if (factor <= 0) return [...points1];
      if (factor >= 1) return [...points2];

      // Since data is pre-normalized, we can use direct interpolation when lengths match
      if (points1.length === points2.length) {
        return points1.map((p1, i) => {
          const p2 = points2[i];
          return {
            x: p1.x + (p2.x - p1.x) * factor,
            y: p1.y + (p2.y - p1.y) * factor
          };
        });
      }

      // Mismatched lengths: optionally resample only for the in-between frames
      if (CONFIG.ANIMATION.MORPH.RESAMPLE_DURING_MORPH && FaceApp.utils && FaceApp.utils.resample) {
        const targetCount = CONFIG.ANIMATION.MORPH.SAMPLE_POINTS || Math.max(points1.length, points2.length);
        const p1r = FaceApp.utils.resample(points1, targetCount);
        const p2r = FaceApp.utils.resample(points2, targetCount);
        return p1r.map((p1, i) => {
          const p2 = p2r[i];
          return {
            x: p1.x + (p2.x - p1.x) * factor,
            y: p1.y + (p2.y - p1.y) * factor
          };
        });
      }

      // Simple fallback if resample util is unavailable
      const targetCount = Math.max(points1.length, points2.length);
      return Array.from({ length: targetCount }, (_, i) => {
        const p1 = points1[i % points1.length];
        const p2 = points2[i % points2.length];
        return {
          x: p1.x + (p2.x - p1.x) * factor,
          y: p1.y + (p2.y - p1.y) * factor
        };
      });
    }
  }

  // Export the controller
  FaceApp.AnimationController = AnimationController;
})(window);
