/**
 * Morph module for smooth animation between face variations
 * Provides utilities for point interpolation and morphing animations
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Deep clone an object using JSON serialization
   * @param {Object} o - Object to clone
   * @returns {Object} Deep copy of the object
   */
  const clone = o => JSON.parse(JSON.stringify(o));

  /**
   * Linear interpolation between two points
   * @param {Object} a - Start point {x, y}
   * @param {Object} b - End point {x, y}
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Object} Interpolated point {x, y}
   */
  function lerpPt(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }

  /**
   * Calculate Euclidean distance between two points
   * @param {Object} a - First point {x, y}
   * @param {Object} b - Second point {x, y}
   * @returns {number} Distance between points
   */
  function dist2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  /**
   * Resample a polyline to have exactly N points with uniform arc length distribution
   * This ensures all polylines have the same number of points for smooth morphing
   * @param {Array} points - Array of {x, y} points
   * @param {number} N - Target number of points
   * @returns {Array} Resampled array with exactly N points
   */
  function resample(points, N) {
    if (!points || !points.length) return [];

    let P = clone(points);

    // Calculate total arc length
    let totalLength = 0;
    for (let i = 1; i < P.length; i++) {
      totalLength += dist2(P[i - 1], P[i]);
    }

    // Handle degenerate case (all points are the same)
    if (totalLength === 0) {
      return Array.from({ length: N }, () => clone(P[0]));
    }

    // Calculate step size for uniform distribution
    const stepSize = totalLength / (N - 1);
    const result = [clone(P[0])]; // Start with first point

    let accumulatedDistance = 0;
    let currentIndex = 1;
    let previousPoint = clone(P[0]);

    // Generate N-1 more points with uniform spacing
    while (result.length < N) {
      if (currentIndex >= P.length) {
        // Add final point if we've reached the end
        result.push(clone(P[P.length - 1]));
        continue;
      }

      const currentPoint = P[currentIndex];
      const segmentLength = dist2(previousPoint, currentPoint);

      if (accumulatedDistance + segmentLength >= stepSize) {
        // We need to place a point within this segment
        const distanceNeeded = stepSize - accumulatedDistance;
        const t = distanceNeeded / segmentLength; // Interpolation factor

        // Create interpolated point
        const interpolatedPoint = {
          x: previousPoint.x + (currentPoint.x - previousPoint.x) * t,
          y: previousPoint.y + (currentPoint.y - previousPoint.y) * t
        };

        result.push(interpolatedPoint);

        // Insert this point into the array for next iteration
        previousPoint = interpolatedPoint;
        P.splice(currentIndex, 0, interpolatedPoint);
        accumulatedDistance = 0;
      } else {
        // Move to next segment
        accumulatedDistance += segmentLength;
        previousPoint = currentPoint;
        currentIndex++;
      }
    }

    return result;
  }

  /**
   * Cubic easing function for smooth animations (ease-out)
   * @param {number} t - Input value (0-1)
   * @returns {number} Eased value (0-1)
   */
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  // Export public interface  
  FaceApp.utils = { resample, lerpPt, clone, dist2, easeOutCubic };
})(window);
