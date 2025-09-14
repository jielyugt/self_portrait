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
      PATH: 'faces_v2',
      COUNT: 6,
      // Preserve original point counts by default (no pre-normalization)
      // Set to true only if you want to equalize point counts on load
      PRE_NORMALIZE_POINTS: false,
      // File paths for face JSON data
      get FILES() {
        return Array.from({ length: this.COUNT }, (_, i) => `${this.PATH}/face_${i + 1}.json`);
      }
    },

    // === CANVAS & RENDERING ===
    CANVAS: {
      // Portrait size as percentage of minimum viewport dimension
      SIZE_RATIO: 0.9,
      // Background color
      BACKGROUND_COLOR: '#ffffff',
      // Debug border for development (easily toggle on/off)
      DEBUG_BORDER: {
        ENABLED: false,       // Set to true to show canvas boundaries
        COLOR: '#ff0000',     // Border color (red for visibility)
        WIDTH: 2              // Border width in pixels
      }
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
        HEAD: {
          SCALE_X: 1.0,
          SCALE_Y: 1.0,
          OFFSET_X: 0.0,
          OFFSET_Y: -0.02
        },
        LEFT_EYE: {
          SCALE_X: 1.0,
          SCALE_Y: 1.0,
          OFFSET_X: 0.0,
          OFFSET_Y: 0.0
        },
        RIGHT_EYE: {
          SCALE_X: 1.0,
          SCALE_Y: 1.0,
          OFFSET_X: 0.0,
          OFFSET_Y: 0.0
        },
        MOUTH: {
          SCALE_X: 1.0,
          SCALE_Y: 1.0,
          OFFSET_X: 0.0,
          OFFSET_Y: 0.0
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
        DURATION_SEC: 3,      // How long the morph animation takes (seconds)
        START_DELAY_SEC: 0.5,
        SAMPLE_POINTS: 32,    // Optimized point count for performance
        // When PRE_NORMALIZE_POINTS is false, we'll resample only during
        // the in-between frames of a morph (not at rest) so originals stay intact
        RESAMPLE_DURING_MORPH: true
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
      DEFAULT_WEIGHTS: [1, 0, 0, 0, 0, 0]
    },

    // === MBTI SYSTEM ===
    MBTI: {
      // Default MBTI values (all at neutral 0)
      DEFAULT_VALUES: [0, 0, 0, 0], // [e_i, s_n, t_f, j_p]

      // MBTI dimension labels
      DIMENSIONS: [
        { name: 'E/I', left: '🕺', right: '🧘' },
        { name: 'S/N', left: '🔍', right: '🔮' },
        { name: 'T/F', left: '🧠', right: '❤️' },
        { name: 'J/P', left: '📅', right: '🎲' }
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

        movement: {
          s_n: -0.4,
          j_p: 0.6
        }
      }
    },

    // === CHAT INTERFACE ===
    CHAT: {
      // QA Mode settings
      QA_MODE: {
        HIDE_TOGGLE_DURING_QA: true,
        HIDE_TOGGLE_AFTER_QA: true,
      },

      // File paths
      FILES: {
        INTRO_YAML: 'chat/intro.yaml',
        MBTI_QUESTIONS: 'chat/mbti_questions.json',
        IPHONE_IMAGE: 'chat/iphone.png'
      },

      // iPhone mockup positioning and sizing
      IPHONE: {
        WIDTH: 280,                    // iPhone mockup width in pixels
        HEIGHT: 560,                   // iPhone mockup height in pixels
        SCREEN_INSET: {                // Screen area within phone frame
          TOP: 60,                     // Top bezel height
          BOTTOM: 60,                  // Bottom bezel height
          LEFT: 20,                    // Left bezel width
          RIGHT: 20                    // Right bezel width
        },
        POSITION: {
          RIGHT_MARGIN: 50,            // Distance from right edge of viewport
          VERTICAL_CENTER_OFFSET: 0    // Offset from vertical center
        }
      },

      // Portrait positioning
      PORTRAIT: {
        POSITION: {
          LEFT_MARGIN: 50                     // Distance from left edge of viewport
        }
      },

      // Responsive portrait mode settings (width < height)
      RESPONSIVE: {
        // Canvas positioning in portrait mode (top half)
        CANVAS: {
          TOP_HALF_HEIGHT_RATIO: 0.6,    // How much of screen height to use for top half
          SIZE_RATIO: 0.9,                // Canvas size as ratio of available space
          VERTICAL_OFFSET: 0           // Vertical offset from center of top half
        },

        // Text area positioning in portrait mode (bottom area)
        TEXT_AREA: {
          WIDTH_RATIO: 0.9,               // How much of screen width to use
          HORIZONTAL_MARGIN_RATIO: 0.05,  // Horizontal margins as ratio of width
          VERTICAL_PADDING_RATIO: 0.03,   // Top/bottom padding as ratio of area height
          BORDER_RADIUS: 15,              // Border radius for text area
          BACKGROUND: 'rgba(255, 255, 255, 0.95)', // Background color

          // Text area height limiting - stays within bottom area, never invades figure area
          MAX_HEIGHT_RATIO: 0.8,          // Max height as ratio of allocated bottom area (calculated as 1 - TOP_HALF_HEIGHT_RATIO)

          // Flip toggle positioning in portrait mode
          FLIP_TOGGLE: {
            BOTTOM_OFFSET_RATIO: 0.02,    // Distance from bottom as ratio of screen height
            RIGHT_OFFSET_RATIO: 0.05,     // Distance from right as ratio of screen width
            PORTRAIT_TEXT: 'show MBTI ->'    // Text to show in portrait mode
          }
        }
      },

      // Chat bubble styling
      BUBBLES: {
        // Pablo's message bubbles (left side)
        PABLO: {
          BACKGROUND: '#000000ff',       // Blue background
          TEXT_COLOR: '#FFFFFF',       // White text
          BORDER_RADIUS: 10,           // Rounded corners
          PADDING: { X: 16, Y: 12 },   // Internal padding
          MAX_WIDTH: 9999,              // Full width
          MARGIN: { X: 20, Y: 8 },     // Margin between bubbles
          ALIGN: 'left'                // Alignment within chat area
        },

        // User choice bubbles (right side)
        USER: {
          BACKGROUND: '#E9E9EB',       // Light gray background
          TEXT_COLOR: '#000000',       // Black text
          BORDER_RADIUS: 10,           // Rounded corners
          PADDING: { X: 16, Y: 12 },   // Internal padding
          MAX_WIDTH: 9999,              // Full width
          MARGIN: { X: 20, Y: 8 },     // Margin between bubbles
          ALIGN: 'right',              // Alignment within chat area
          HOVER_BACKGROUND: '#D1D1D6'  // Background on hover
        },

        // Typing indicator bubble
        TYPING: {
          DOT_COLOR: '#FFFFFF',        // White dots
          DOT_SIZE: 4,                 // Dot diameter
          DOT_SPACING: 3,              // Space between dots
          ANIMATION_DURATION: 600,     // Dot animation cycle time in ms
          MARGIN: {                    // Margin around typing indicator
            TOP: 30,                  // Extra top margin to push down
            BOTTOM: 8,                // Bottom margin
            LEFT: 20,                 // Left margin
            RIGHT: 20                 // Right margin
          }
        }
      },

      // Text styling
      TEXT: {
        FONT_FAMILY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        FONT_SIZE: 14,               // Base font size
        LINE_HEIGHT: 1.4,            // Line height multiplier
        SPEAKER_FONT_SIZE: 12,       // Font size for speaker name
        SPEAKER_COLOR: '#8E8E93'     // Color for speaker name
      },

      // Animation and timing
      ANIMATION: {
        TYPING_PAUSE_PER_CHAR: 0.04, // Seconds of typing animation per character
        MIN_TYPING_TIME: 0.5,        // Minimum typing animation time in seconds
        MAX_TYPING_TIME: 2.0,        // Maximum typing animation time in seconds
        BUBBLE_APPEAR_DURATION: 0.3, // Bubble fade-in animation duration
        CHOICE_HOVER_DURATION: 0.2,  // Choice button hover animation duration
        CHOICE_INITIAL_DELAY: 0.3,    // Delay before first choice button appears (seconds)
        CHOICE_STAGGER_DELAY: 0.3,   // Delay between each choice button appearing (seconds)
        AUTO_SLIDER_DELAY: 3.0,      // Delay before automatically showing sliders after self-portrait message (seconds)
      },

      // Chat area dimensions (within iPhone screen)
      CHAT_AREA: {
        PADDING: { TOP: 30, BOTTOM: 100, LEFT: 0, RIGHT: 0 }, // Padding within screen
        SCROLL_SPEED: 0.1            // Auto-scroll speed when new messages appear
      }
    }
  };

  // Export the configuration
  FaceApp.CONFIG = CONFIG;
})(window);
