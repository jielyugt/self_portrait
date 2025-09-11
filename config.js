/**
 * Configuration file for Portrait Generator
 * Contains all customizable parameters and constants
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  const CONFIG = {
    // === FACE DATA ===
    FACES: {
      // Change this to switch face folder easily
      PATH: 'faces',
      COUNT: 6,
      // File paths for face JSON data
      get FILES() {
        return Array.from({ length: this.COUNT }, (_, i) => `${this.PATH}/face_${i + 1}.json`);
      }
    },

    // === CANVAS & RENDERING ===
    CANVAS: {
      // Portrait size as percentage of minimum viewport dimension
      SIZE_RATIO: 0.72,
      // Background color
      BACKGROUND_COLOR: '#ffffff'
    },

    // === VISUAL STYLING ===
    VISUAL: {
      // Line weights for different face components
      LINE_WEIGHTS: {
        HEAD: 4,        // Head outline stroke weight
        EYES: 4,        // Eye stroke weight  
        MOUTH: 4        // Mouth stroke weight
      },
      // Line color
      STROKE_COLOR: 20, // Grayscale value (0=black, 255=white)

      // Component scaling and positioning
      SCALING: {
        // Left eye scaling and positioning
        LEFT_EYE: {
          SCALE_X: 0.9,     // Scale factor for width
          SCALE_Y: 0.825,   // Scale factor for height
          OFFSET_X: 0.05,   // X position offset
          OFFSET_Y: 0.0375  // Y position offset
        },
        // Right eye scaling and positioning (same as left eye)
        RIGHT_EYE: {
          SCALE_X: 0.9,
          SCALE_Y: 0.825,
          OFFSET_X: 0.05,
          OFFSET_Y: 0.0375
        },
        // Mouth scaling and positioning
        MOUTH: {
          SCALE_X: 1.05,    // Scale factor for width
          SCALE_Y: 0.525,   // Scale factor for height
          OFFSET_X: -0.025, // X position offset
          OFFSET_Y: 0.3375  // Y position offset
        }
      }
    },

    // === ANIMATION & EFFECTS ===
    ANIMATION: {
      // Organic noise effect on head outline
      ORGANIC_NOISE: {
        ENABLED: true,
        STRENGTH: 0.1,        // How strong the organic movement is
        SCALE: 0.005,         // Perlin noise scale factor
        TIME_SPEED: 0.0003,   // Animation speed multiplier
        TIME_OFFSET_Y: 1.37,  // Y-axis time offset for variation
        UNIQUE_OFFSET: 0.05   // Per-point offset for variation
      },

      // Morphing animation settings
      MORPH: {
        DURATION_SEC: 0.6,    // How long morphing takes
        SAMPLE_POINTS: 64     // Number of points to resample polylines to
      }
    },

    // === HEXAGON UI ===
    HEXAGON_UI: {
      // Canvas dimensions
      CANVAS: {
        WIDTH: 200,
        HEIGHT: 200
      },

      // Hexagon geometry
      GEOMETRY: {
        CENTER_X: 100,        // Center X coordinate
        CENTER_Y: 100,        // Center Y coordinate  
        RADIUS: 80,           // Distance from center to vertices
        START_ANGLE_OFFSET: -Math.PI / 2  // Start from top vertex
      },

      // Visual styling
      STYLE: {
        BORDER_WIDTH: 2,      // Hexagon outline width
        BORDER_COLOR: '#000', // Hexagon outline color
        VERTEX_RADIUS: 8,     // Size of vertex circles
        VERTEX_BG: '#fff',    // Vertex background color
        VERTEX_BORDER: '#000', // Vertex border color

        // Current position indicator
        POSITION_RADIUS: 6,   // Size of position dot
        POSITION_COLOR: '#ff0000', // Position dot color

        // Influence lines
        INFLUENCE_COLOR: 'rgba(255, 0, 0, 0.3)', // Color of influence lines
        INFLUENCE_WIDTH: 1,   // Width of influence lines

        // Text styling
        FONT: '12px Arial',
        TEXT_COLOR: '#000'
      },

      // Interaction settings
      INTERACTION: {
        RANDOMIZE_BOUNDS: 0.8 // How far from center randomize can place cursor (0-1)
      }
    },

    // === USER INTERFACE ===
    UI: {
      // Keyboard shortcuts
      SHORTCUTS: {
        SAVE_KEY: 's'         // Key to save PNG
      },

      // File naming
      FILES: {
        EXPORT_NAME: 'portrait' // Default filename for saved images
      }
    },

    // === BLENDING ===
    BLENDING: {
      // Default weights when app starts (100% face 1)
      DEFAULT_WEIGHTS: [1, 0, 0, 0, 0, 0],

      // Minimum weight threshold for calculations
      MIN_WEIGHT_THRESHOLD: 0.001
    },

    // === MBTI SYSTEM ===
    MBTI: {
      // Default MBTI values (all at neutral 0)
      DEFAULT_VALUES: [0, 0, 0, 0], // [e_i, s_n, t_f, j_p]

      // MBTI dimension labels
      DIMENSIONS: [
        { name: 'E/I', left: 'Extraversion', right: 'Introversion' },
        { name: 'S/N', left: 'Sensing', right: 'Intuition' },
        { name: 'T/F', left: 'Thinking', right: 'Feeling' },
        { name: 'J/P', left: 'Judging', right: 'Perceiving' }
      ],

      FEATURE_WEIGHTS: {
        eye: {
          e_i: -0.3,
          s_n: -0.2,
          j_p: 0.5
        },

        mouth: {
          e_i: -0.5,
          t_f: -0.5
        },

        head: {
          s_n: 0.6,
          t_f: 0.4
        },

        proportion: {
          e_i: 0.7,
          j_p: 0.3
        },

        movement: {
          s_n: -0.4,
          j_p: 0.6
        }
      }
    }
  };

  // Export the configuration
  FaceApp.CONFIG = CONFIG;
})(window);
