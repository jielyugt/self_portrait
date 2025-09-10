// hexagon-ui.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  class HexagonUI {
    constructor(canvasId, onChange) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.onChange = onChange;
      this.center = { x: 100, y: 100 };
      this.radius = 80;

      // Calculate hexagon vertices (6 corners for 6 faces)
      this.vertices = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2; // Start from top
        this.vertices.push({
          x: this.center.x + Math.cos(angle) * this.radius,
          y: this.center.y + Math.sin(angle) * this.radius,
          faceIndex: i
        });
      }

      // Start at vertex 0 (Face 1) position
      this.currentPos = { x: this.vertices[0].x, y: this.vertices[0].y };

      this.setupEvents();
      this.draw();
      this.updateBlending(); // Initial blend calculation
    }

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

    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if point is inside hexagon
      if (this.isPointInHexagon(x, y)) {
        this.currentPos = { x, y };
        this.draw();
        this.updateBlending();
      }
    }

    isPointInHexagon(x, y) {
      // Simple distance check from center for now
      const dx = x - this.center.x;
      const dy = y - this.center.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

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
        : [1, 0, 0, 0, 0, 0]; // Default to first face if no weight

      // Update blend display
      for (let i = 0; i < 6; i++) {
        const percentage = Math.round(normalizedWeights[i] * 100);
        const element = document.getElementById(`blend${i + 1}`);
        if (element) {
          element.textContent = `${percentage}%`;
        }
      }

      // Notify the main system of the blend change
      if (this.onChange) {
        this.onChange(normalizedWeights);
      }
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw hexagon outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
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

      // Draw vertex labels
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      this.vertices.forEach((vertex, i) => {
        // Draw vertex circle
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Draw face number
        ctx.fillStyle = '#000';
        ctx.fillText(`${i + 1}`, vertex.x, vertex.y);
      });

      // Draw current position
      ctx.beginPath();
      ctx.arc(this.currentPos.x, this.currentPos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();

      // Draw lines to nearby vertices to show influence
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      this.vertices.forEach(vertex => {
        const dx = this.currentPos.x - vertex.x;
        const dy = this.currentPos.y - vertex.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius) {
          ctx.beginPath();
          ctx.moveTo(this.currentPos.x, this.currentPos.y);
          ctx.lineTo(vertex.x, vertex.y);
          ctx.stroke();
        }
      });
    }

    randomize() {
      // Pick a random point within the hexagon
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.radius * 0.8; // Stay within bounds
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
