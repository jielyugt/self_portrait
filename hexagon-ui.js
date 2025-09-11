/**
 * Hexagon UI Controller
 * Manages the hexagonal blending interface for face morphing
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * HexagonUI class manages the interactive hexagon for blending faces
   */
  class HexagonUI {
    /**
     * Creates a new HexagonUI instance
     * @param {string} canvasId - ID of the canvas element
     * @param {Function} onChange - Callback function for blend weight changes
     */
    constructor(canvasId, onChange) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.onChange = onChange;

      // Use configuration for geometry
      this.center = {
        x: CONFIG.HEXAGON_UI.GEOMETRY.CENTER_X,
        y: CONFIG.HEXAGON_UI.GEOMETRY.CENTER_Y
      };
      this.radius = CONFIG.HEXAGON_UI.GEOMETRY.RADIUS;

      // Calculate hexagon vertices (6 corners for 6 faces)
      this.vertices = this.calculateVertices();

      // Start at vertex 0 (Face 1) position
      this.currentPos = { x: this.vertices[0].x, y: this.vertices[0].y };

      // Initialize the interface
      this.setupEvents();
      this.draw();
      this.updateBlending(); // Calculate initial blend weights
    }

    /**
     * Calculates the positions of hexagon vertices
     * @returns {Array} Array of vertex objects with x, y, and faceIndex
     */
    calculateVertices() {
      const vertices = [];
      for (let i = 0; i < CONFIG.FACES.COUNT; i++) {
        const angle = (i * Math.PI * 2) / CONFIG.FACES.COUNT + CONFIG.HEXAGON_UI.GEOMETRY.START_ANGLE_OFFSET;
        vertices.push({
          x: this.center.x + Math.cos(angle) * this.radius,
          y: this.center.y + Math.sin(angle) * this.radius,
          faceIndex: i
        });
      }
      return vertices;
    }

    /**
     * Sets up mouse and touch event handlers for the canvas
     */
    setupEvents() {
      this.canvas.addEventListener('mousedown', (e) => {
        this.handleMouseMove(e);
      });

      this.canvas.addEventListener('mousemove', (e) => {
        if (e.buttons === 1) { // Left mouse button pressed
          this.handleMouseMove(e);
        }
      });

      this.canvas.addEventListener('click', (e) => {
        this.handleMouseMove(e);
      });
    }

    /**
     * Handles mouse movement and updates cursor position if within bounds
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only update if point is within the hexagon bounds
      if (this.isPointInHexagon(x, y)) {
        this.currentPos = { x, y };
        this.draw();
        this.updateBlending();
      }
    }

    /**
     * Checks if a point is inside the hexagon (using simple radius check)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @returns {boolean} True if point is inside hexagon
     */
    isPointInHexagon(x, y) {
      const dx = x - this.center.x;
      const dy = y - this.center.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    /**
     * Calculates and updates blend weights based on cursor position
     * Uses inverse distance weighting from each vertex
     */
    updateBlending() {
      // Calculate blend weights based on distance from each vertex
      const weights = this.vertices.map(vertex => {
        const dx = this.currentPos.x - vertex.x;
        const dy = this.currentPos.y - vertex.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Inverse distance weighting with falloff
        return Math.max(0, 1 - (distance / this.radius));
      });

      // Normalize weights so they sum to 1
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const normalizedWeights = totalWeight > 0
        ? weights.map(w => w / totalWeight)
        : [...CONFIG.BLENDING.DEFAULT_WEIGHTS]; // Use default if no weight

      // Update blend percentage display in UI
      this.updateBlendDisplay(normalizedWeights);

      // Notify the main system of the blend change
      if (this.onChange) {
        this.onChange(normalizedWeights);
      }
    }

    /**
     * Updates the blend percentage display in the UI
     * @param {Array} weights - Normalized blend weights
     */
    updateBlendDisplay(weights) {
      for (let i = 0; i < CONFIG.FACES.COUNT; i++) {
        const percentage = Math.round(weights[i] * 100);
        const element = document.getElementById(`blend${i + 1}`);
        if (element) {
          element.textContent = `${percentage}%`;
        }
      }
    }

    /**
     * Renders the hexagon interface
     */
    draw() {
      const ctx = this.ctx;
      const style = CONFIG.HEXAGON_UI.STYLE;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw hexagon outline
      this.drawHexagonOutline(ctx, style);

      // Draw vertices with labels
      this.drawVertices(ctx, style);

      // Draw current cursor position
      this.drawCurrentPosition(ctx, style);

      // Draw influence lines to show blending
      this.drawInfluenceLines(ctx, style);
    }

    /**
     * Draws the hexagon outline
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} style - Style configuration
     */
    drawHexagonOutline(ctx, style) {
      ctx.strokeStyle = style.BORDER_COLOR;
      ctx.lineWidth = style.BORDER_WIDTH;
      ctx.beginPath();

      this.vertices.forEach((vertex, i) => {
        if (i === 0) {
          ctx.moveTo(vertex.x, vertex.y);
        } else {
          ctx.lineTo(vertex.x, vertex.y);
        }
      });

      ctx.closePath();
      ctx.stroke();
    }

    /**
     * Draws vertex circles with face numbers
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} style - Style configuration
     */
    drawVertices(ctx, style) {
      ctx.font = style.FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      this.vertices.forEach((vertex, i) => {
        // Draw vertex circle
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, style.VERTEX_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = style.VERTEX_BG;
        ctx.fill();
        ctx.strokeStyle = style.VERTEX_BORDER;
        ctx.stroke();

        // Draw face number
        ctx.fillStyle = style.TEXT_COLOR;
        ctx.fillText(`${i + 1}`, vertex.x, vertex.y);
      });
    }

    /**
     * Draws the current cursor position indicator
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} style - Style configuration
     */
    drawCurrentPosition(ctx, style) {
      ctx.beginPath();
      ctx.arc(this.currentPos.x, this.currentPos.y, style.POSITION_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = style.POSITION_COLOR;
      ctx.fill();
    }

    /**
     * Draws influence lines from cursor to nearby vertices
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} style - Style configuration
     */
    drawInfluenceLines(ctx, style) {
      ctx.strokeStyle = style.INFLUENCE_COLOR;
      ctx.lineWidth = style.INFLUENCE_WIDTH;

      this.vertices.forEach(vertex => {
        const dx = this.currentPos.x - vertex.x;
        const dy = this.currentPos.y - vertex.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only draw lines to vertices within influence range
        if (distance < this.radius) {
          ctx.beginPath();
          ctx.moveTo(this.currentPos.x, this.currentPos.y);
          ctx.lineTo(vertex.x, vertex.y);
          ctx.stroke();
        }
      });
    }

    /**
     * Randomizes the cursor position within the hexagon
     */
    randomize() {
      // Pick a random point within the hexagon
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.radius * CONFIG.HEXAGON_UI.INTERACTION.RANDOMIZE_BOUNDS;

      this.currentPos = {
        x: this.center.x + Math.cos(angle) * distance,
        y: this.center.y + Math.sin(angle) * distance
      };

      this.draw();
      this.updateBlending();
    }
  }

  FaceApp.HexagonUI = HexagonUI;
})(window);
