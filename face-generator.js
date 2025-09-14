/**
 * Face Generator Module
 * Handles face data loading and shape generation logic
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * FaceGenerator class handles face data loading and shape generation
   */
  class FaceGenerator {
    constructor(appState) {
      this.appState = appState;
      this.NORMALIZED_POINT_COUNT = CONFIG.ANIMATION.MORPH.SAMPLE_POINTS || 32;
    }

    /**
     * Load all face data from JSON files and pre-normalize for optimal morphing
     * @returns {Promise<Array>} Promise resolving to loaded face sets
     */
    async loadFaceData() {
      try {
        const faceSets = await Promise.all(CONFIG.FACES.FILES.map(async (file) => {
          const data = await fetch(file).then(r => r.json());

          // Convert array format to point objects, map 'face' to 'head'
          const raw = {
            head: this.arrayToPoints(data.face),  // Use 'face' field from JSON
            left_eye: this.arrayToPoints(data.left_eye),
            right_eye: this.arrayToPoints(data.right_eye),
            mouth: this.arrayToPoints(data.mouth)
          };

          // Normalize structure (field names) only
          const normalized = this.normalizeFaceSet(raw);

          // Optionally pre-normalize point counts (disabled by default to preserve originals)
          return CONFIG.FACES.PRE_NORMALIZE_POINTS
            ? this.preNormalizePointCounts(normalized)
            : normalized;
        }));

        console.log('Loaded and pre-normalized', faceSets.length, 'face sets');
        this.appState.setFaceData(faceSets);
        return faceSets;
      } catch (error) {
        console.error('Failed to load face data:', error);
        throw error;
      }
    }

    /**
     * Converts array of [x,y] coordinates to array of {x,y} point objects
     * @param {Array} arr - Array of [x, y] coordinate pairs
     * @returns {Array} Array of {x, y} point objects
     */
    arrayToPoints(arr) {
      return (arr || []).map(([x, y]) => ({ x, y }));
    }

    /**
     * Normalizes face set data (maps 'face' to 'head' and ensures consistent structure)
     * @param {Object} set - Raw face set data
     * @returns {Object} Normalized face set
     */
    normalizeFaceSet(set) {
      return {
        head: set.head || set.face,  // Map 'face' to 'head' for consistency
        left_eye: set.left_eye,
        right_eye: set.right_eye,
        mouth: set.mouth
      };
    }

    /**
     * Pre-normalize all features to have consistent point counts for smooth morphing
     * @param {Object} faceSet - Face set with varying point counts
     * @returns {Object} Face set with normalized point counts
     */
    preNormalizePointCounts(faceSet) {
      const normalized = {};

      ['head', 'left_eye', 'right_eye', 'mouth'].forEach(feature => {
        if (faceSet[feature] && faceSet[feature].length > 0) {
          // Use different target counts for different features for optimal morphing
          let targetCount;
          switch (feature) {
            case 'head':
              targetCount = Math.max(this.NORMALIZED_POINT_COUNT, faceSet[feature].length);
              break;
            case 'left_eye':
            case 'right_eye':
              targetCount = Math.max(8, faceSet[feature].length); // Eyes need fewer points
              break;
            case 'mouth':
              targetCount = Math.max(12, faceSet[feature].length); // Mouth needs moderate points
              break;
            default:
              targetCount = this.NORMALIZED_POINT_COUNT;
          }

          normalized[feature] = this.resamplePoints(faceSet[feature], targetCount);
        } else {
          normalized[feature] = [];
        }
      });

      return normalized;
    }

    /**
     * Resample points to target count using arc-length parameterization
     * @param {Array} points - Original points
     * @param {number} targetCount - Target number of points
     * @returns {Array} Resampled points
     */
    resamplePoints(points, targetCount) {
      if (!points || points.length === 0) return [];
      if (points.length === targetCount) return [...points];
      if (targetCount === 1) return [{ ...points[0] }];

      // Use the existing resample function from morph.js utils
      if (FaceApp.utils && FaceApp.utils.resample) {
        return FaceApp.utils.resample(points, targetCount);
      }

      // Fallback: simple linear interpolation
      const result = [];
      for (let i = 0; i < targetCount; i++) {
        const t = i / (targetCount - 1);
        const index = t * (points.length - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const factor = index - lowerIndex;

        if (lowerIndex === upperIndex) {
          result.push({ ...points[lowerIndex] });
        } else {
          const p1 = points[lowerIndex];
          const p2 = points[upperIndex];
          result.push({
            x: p1.x + (p2.x - p1.x) * factor,
            y: p1.y + (p2.y - p1.y) * factor
          });
        }
      }

      return result;
    }

    /**
     * Generate face shapes from current state
     * @returns {Object} Generated face shapes
     */
    generateCurrentFaceShapes() {
      return this.appState.generateCurrentFaceShapes();
    }

    /**
     * Helper function to show which shape indices are selected for debugging
     * @param {Object} faceParams - Face parameters
     * @param {number} faceCount - Number of face files
     * @returns {Object} Selected indices for each feature
     */
    getShapeIndices(faceParams, faceCount) {
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
    }
  }

  // Export the FaceGenerator
  FaceApp.FaceGenerator = FaceGenerator;
})(window);
