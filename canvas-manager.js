/**
 * Canvas Manager
 * Handles canvas setup, positioning, and export functionality
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * CanvasManager class handles canvas operations and export
   */
  class CanvasManager {
    constructor(appState) {
      this.appState = appState;
      this.pg = null; // Off-screen graphics buffer
    }

    /**
     * Initialize canvas and graphics buffer
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    initialize(width, height) {
      createCanvas(width, height);
      this.pg = createGraphics(width, height);
    }

    /**
     * Handle window resize
     */
    handleResize() {
      resizeCanvas(windowWidth, windowHeight);
      this.pg = createGraphics(windowWidth, windowHeight);
    }

    /**
     * Check if we're in portrait mode (width < height)
     * @returns {boolean} True if in portrait mode
     */
    isPortraitMode() {
      return width < height;
    }

    /**
     * Calculate optimal canvas positioning for automatic centering
     * @returns {Object} Canvas positioning information
     */
    calculateCanvasPosition() {
      const inPortraitMode = this.isPortraitMode();

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
        const canvasSize = Math.min(availableWidth, height) * this.appState.portraitSize;

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
     * @param {Object} canvasInfo - Canvas positioning information
     */
    drawDebugBorder(canvasInfo) {
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
     * Clear canvas with background color
     */
    clearCanvas() {
      background(CONFIG.CANVAS.BACKGROUND_COLOR);
      this.pg.clear();
    }

    /**
     * Get the graphics buffer for drawing
     * @returns {p5.Graphics} Graphics buffer
     */
    getGraphicsBuffer() {
      return this.pg;
    }

    /**
     * Render the graphics buffer to main canvas
     */
    renderToCanvas() {
      image(this.pg, 0, 0);
    }

    /**
     * Save only the face canvas area as a square image
     * @param {Object} facePoints - Current face points to render
     * @param {Function} addOrganicNoise - Organic noise function
     */
    saveCanvasArea(facePoints, addOrganicNoise) {
      // Calculate the current canvas position and size
      const canvasInfo = this.calculateCanvasPosition();
      const { canvasSize } = canvasInfo;

      // Create a square canvas for the face
      const faceCanvas = createGraphics(canvasSize, canvasSize);

      // Set background color (not transparent)
      faceCanvas.background(CONFIG.CANVAS.BACKGROUND_COLOR);

      if (!facePoints) {
        console.error('No face data available');
        return;
      }

      // Apply same animation as main canvas
      const movementStrength = (this.appState.faceParams.movement || 0) * 0.5 + 0.5;
      const points = {
        head: CONFIG.ANIMATION.ORGANIC_NOISE.ENABLED
          ? addOrganicNoise(facePoints.head, millis(), movementStrength)
          : facePoints.head,
        left_eye: facePoints.left_eye,
        right_eye: facePoints.right_eye,
        mouth: facePoints.mouth
      };

      // Draw face centered in the square canvas
      FaceApp.Renderer.composeFace(faceCanvas, points, canvasSize / 2, canvasSize / 2, canvasSize);

      // Save the face canvas
      save(faceCanvas, CONFIG.UI.FILES.EXPORT_NAME, 'png');
    }
  }

  // Export the CanvasManager
  FaceApp.CanvasManager = CanvasManager;
})(window);
