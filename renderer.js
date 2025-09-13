/**
 * Renderer module for drawing face components
 * Handles rendering of polylines and complete face composition
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * Draws a polyline (series of connected points) on the graphics buffer
   * @param {p5.Graphics} pg - p5.js graphics buffer to draw on
   * @param {Array} pts - Array of {x, y} points to draw
   * @param {number} cx - Center X coordinate for positioning
   * @param {number} cy - Center Y coordinate for positioning  
   * @param {number} w - Width scaling factor
   * @param {number} h - Height scaling factor
   * @param {Object} opts - Drawing options
   */
  function drawPolyline(pg, pts, cx, cy, w, h, opts = {}) {
    const {
      close = false,
      weight = CONFIG.VISUAL.LINE_WEIGHTS.HEAD,
      stroke = CONFIG.VISUAL.STROKE_COLOR
    } = opts;

    pg.push();
    pg.translate(cx, cy);
    pg.noFill();
    pg.stroke(stroke);
    pg.strokeWeight(weight);
    pg.beginShape();

    // Draw each point, converting from [0,1] coordinate space to canvas space
    for (const p of pts) {
      pg.vertex((p.x - 0.5) * w, (p.y - 0.5) * h);
    }

    if (close) {
      pg.endShape(pg.CLOSE);
    } else {
      pg.endShape();
    }
    pg.pop();
  }

  /**
   * Renders a complete face by drawing all components with proper scaling and positioning
   * @param {p5.Graphics} pg - p5.js graphics buffer to draw on
   * @param {Object} parts - Face parts containing head, left_eye, right_eye, mouth
   * @param {number} cx - Center X coordinate
   * @param {number} cy - Center Y coordinate
   * @param {number} size - Overall face size
   */
  function composeFace(pg, parts, cx, cy, size) {
    // Draw head outline with configured scaling and positioning
    const headScaled = scaleAndPositionPoints(parts.head, CONFIG.VISUAL.SCALING.HEAD);
    drawPolyline(pg, headScaled, cx, cy, size, size, {
      weight: CONFIG.VISUAL.LINE_WEIGHTS.HEAD
    });

    // Draw left eye with configured scaling and positioning
    const leftEyeScaled = scaleAndPositionPoints(parts.left_eye, CONFIG.VISUAL.SCALING.LEFT_EYE);
    drawPolyline(pg, leftEyeScaled, cx, cy, size, size, {
      weight: CONFIG.VISUAL.LINE_WEIGHTS.EYES
    });

    // Draw right eye with configured scaling and positioning
    const rightEyeScaled = scaleAndPositionPoints(parts.right_eye, CONFIG.VISUAL.SCALING.RIGHT_EYE);
    drawPolyline(pg, rightEyeScaled, cx, cy, size, size, {
      weight: CONFIG.VISUAL.LINE_WEIGHTS.EYES
    });

    // Draw mouth with configured scaling and positioning
    const mouthScaled = scaleAndPositionPoints(parts.mouth, CONFIG.VISUAL.SCALING.MOUTH);
    drawPolyline(pg, mouthScaled, cx, cy, size, size, {
      weight: CONFIG.VISUAL.LINE_WEIGHTS.MOUTH
    });
  }

  /**
   * Scales and positions points according to provided scaling configuration
   * @param {Array} points - Array of {x, y} points to transform
   * @param {Object} scaling - Scaling configuration with SCALE_X, SCALE_Y, OFFSET_X, OFFSET_Y
   * @returns {Array} Transformed points
   */
  function scaleAndPositionPoints(points, scaling) {
    return points.map(p => ({
      x: p.x * scaling.SCALE_X + scaling.OFFSET_X,
      y: p.y * scaling.SCALE_Y + scaling.OFFSET_Y
    }));
  }

  // Export public interface
  FaceApp.Renderer = {
    drawPolyline,
    composeFace,
    scaleAndPositionPoints
  };
})(window);
