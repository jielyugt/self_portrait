/**
 * MBTI Slider UI Controller
 * Manages the 4 continuous sliders for MBTI personality dimensions
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { CONFIG } = FaceApp;

  /**
   * MBTIUI class manages the 4 sliders for E/I, S/N, T/F, J/P dimensions
   */
  class MBTIUI {
    /**
     * Creates a new MBTIUI instance
     * @param {string} containerId - ID of the container element for sliders
     * @param {Function} onChange - Callback function for MBTI value changes
     */
    constructor(containerId, onChange) {
      this.container = document.getElementById(containerId);
      this.onChange = onChange;
      this.values = [...CONFIG.MBTI.DEFAULT_VALUES]; // [e_i, s_n, t_f, j_p]
      this.readOnly = false; // Whether sliders are interactive or view-only

      this.createSliders();
      this.updateDisplay();

      // Trigger initial change to ensure proper initialization
      if (this.onChange) {
        setTimeout(() => {
          console.log('MBTI UI triggering initial change with values:', this.values);
          this.onChange([...this.values]);
        }, 100);
      }
    }

    /**
     * Creates the slider HTML elements and sets up event handlers
     */
    createSliders() {
      // Clear existing content
      this.container.innerHTML = '';

      CONFIG.MBTI.DIMENSIONS.forEach((dimension, index) => {
        // Create slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = 'margin-bottom: 12px;';

        // Create slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '-1';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = this.values[index];
        slider.style.cssText = `width: 100%; accent-color: #000; ${this.readOnly ? 'pointer-events: none; opacity: 0.6;' : ''}`;
        slider.id = `mbti-slider-${index}`;

        // Create value display and labels container
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 4px;';

        const leftLabel = document.createElement('span');
        leftLabel.textContent = dimension.left;
        leftLabel.style.cssText = 'font-size: 10px; color: #666; flex: 1; text-align: left;';

        const valueDisplay = document.createElement('span');
        valueDisplay.id = `mbti-value-${index}`;
        valueDisplay.style.cssText = 'font-size: 10px; font-weight: bold; padding: 0 8px; min-width: 40px; text-align: center;';

        const rightLabel = document.createElement('span');
        rightLabel.textContent = dimension.right;
        rightLabel.style.cssText = 'font-size: 10px; color: #666; flex: 1; text-align: right;';

        // Add event listener (only if not read-only)
        slider.addEventListener('input', (e) => {
          if (this.readOnly) return;

          const value = parseFloat(e.target.value);
          this.values[index] = value;
          this.updateValueDisplay(index);
          if (this.onChange) {
            this.onChange([...this.values]);
          }
        });

        // Assemble the slider
        controlsContainer.appendChild(leftLabel);
        controlsContainer.appendChild(valueDisplay);
        controlsContainer.appendChild(rightLabel);

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(controlsContainer);

        this.container.appendChild(sliderContainer);
      });

      console.log('MBTI sliders created. Container has', this.container.children.length, 'slider containers');
    }

    /**
     * Updates the display of all value labels
     */
    updateDisplay() {
      CONFIG.MBTI.DIMENSIONS.forEach((_, index) => {
        this.updateValueDisplay(index);
      });
    }

    /**
     * Updates the display for a specific slider value
     * @param {number} index - Index of the slider to update
     */
    updateValueDisplay(index) {
      const valueElement = document.getElementById(`mbti-value-${index}`);
      if (valueElement) {
        const value = this.values[index];
        const dimension = CONFIG.MBTI.DIMENSIONS[index];

        let displayText;
        if (Math.abs(value) < 0.1) {
          displayText = 'Neutral';
        } else if (value < 0) {
          displayText = dimension.left.charAt(0) + Math.abs(value).toFixed(1);
        } else {
          displayText = dimension.right.charAt(0) + value.toFixed(1);
        }

        valueElement.textContent = displayText;
      }
    }

    /**
     * Sets read-only mode for the sliders
     * @param {boolean} readOnly - Whether sliders should be read-only
     */
    setReadOnly(readOnly) {
      this.readOnly = readOnly;

      // Update existing sliders
      CONFIG.MBTI.DIMENSIONS.forEach((_, index) => {
        const slider = document.getElementById(`mbti-slider-${index}`);
        if (slider) {
          if (readOnly) {
            slider.style.pointerEvents = 'none';
            slider.style.opacity = '0.6';
          } else {
            slider.style.pointerEvents = '';
            slider.style.opacity = '1';
          }
        }
      });
    }

    /**
     * Hide the MBTI sliders completely
     */
    hide() {
      this.container.style.display = 'none';
    }

    /**
     * Show the MBTI sliders in the left panel
     */
    showInPanel() {
      this.container.style.display = 'block';
      this.readOnly = false;
      this.updateSliderStyles();
    }

    /**
     * Show the MBTI sliders inside the phone interface
     */
    showInPhone() {
      // Hide the left panel sliders
      this.container.style.display = 'none';

      // Create or update phone sliders
      this.createPhoneSliders();
      this.readOnly = false;
    }

    /**
     * Create sliders inside the phone interface
     */
    createPhoneSliders() {
      // Find the chat container
      const chatContainer = document.getElementById('chatContainer');
      if (!chatContainer) return;

      // Remove existing phone sliders
      const existingPhoneSliders = document.getElementById('phoneSliders');
      if (existingPhoneSliders) {
        existingPhoneSliders.remove();
      }

      // Create phone sliders container
      const phoneSlidersContainer = document.createElement('div');
      phoneSlidersContainer.id = 'phoneSliders';
      phoneSlidersContainer.style.cssText = `
        position: fixed;
        right: ${CONFIG.CHAT.IPHONE.POSITION.RIGHT_MARGIN + 20}px;
        top: 50%;
        transform: translateY(-50%);
        width: ${CONFIG.CHAT.IPHONE.WIDTH - 40}px;
        height: ${CONFIG.CHAT.IPHONE.HEIGHT - 160}px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 20px;
        box-sizing: border-box;
        z-index: 15;
        overflow-y: auto;
      `;

      // Add title
      const title = document.createElement('div');
      title.textContent = 'Adjust Your Portrait';
      title.style.cssText = 'font-weight: bold; margin-bottom: 15px; text-align: center; font-size: 14px;';
      phoneSlidersContainer.appendChild(title);

      // Create sliders for phone
      CONFIG.MBTI.DIMENSIONS.forEach((dimension, index) => {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.marginBottom = '15px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '-1';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = this.values[index];
        slider.style.cssText = 'width: 100%; accent-color: #007AFF; margin-bottom: 5px;';
        slider.id = `phone-slider-${index}`;

        const labelContainer = document.createElement('div');
        labelContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; font-size: 10px;';

        const leftLabel = document.createElement('span');
        leftLabel.textContent = dimension.left;
        leftLabel.style.color = '#666';

        const valueDisplay = document.createElement('span');
        valueDisplay.id = `phone-value-${index}`;
        valueDisplay.style.cssText = 'font-weight: bold; font-size: 11px; padding: 0 8px;';

        const rightLabel = document.createElement('span');
        rightLabel.textContent = dimension.right;
        rightLabel.style.color = '#666';

        // Add event listener
        slider.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          this.values[index] = value;
          this.updatePhoneValueDisplay(index);
          if (this.onChange) {
            this.onChange([...this.values]);
          }
        });

        labelContainer.appendChild(leftLabel);
        labelContainer.appendChild(valueDisplay);
        labelContainer.appendChild(rightLabel);

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(labelContainer);
        phoneSlidersContainer.appendChild(sliderContainer);
      });

      chatContainer.appendChild(phoneSlidersContainer);
      this.updatePhoneDisplay();
    }

    /**
     * Update phone slider display values
     */
    updatePhoneDisplay() {
      CONFIG.MBTI.DIMENSIONS.forEach((_, index) => {
        this.updatePhoneValueDisplay(index);
      });
    }

    /**
     * Update a specific phone slider value display
     */
    updatePhoneValueDisplay(index) {
      const valueElement = document.getElementById(`phone-value-${index}`);
      if (valueElement) {
        const value = this.values[index];
        const dimension = CONFIG.MBTI.DIMENSIONS[index];

        let displayText;
        if (Math.abs(value) < 0.1) {
          displayText = 'Neutral';
        } else if (value < 0) {
          displayText = dimension.left.charAt(0) + Math.abs(value).toFixed(1);
        } else {
          displayText = dimension.right.charAt(0) + value.toFixed(1);
        }

        valueElement.textContent = displayText;
      }
    }

    /**
     * Update slider styles when switching modes
     */
    updateSliderStyles() {
      CONFIG.MBTI.DIMENSIONS.forEach((_, index) => {
        const slider = document.getElementById(`mbti-slider-${index}`);
        if (slider) {
          if (this.readOnly) {
            slider.style.pointerEvents = 'none';
            slider.style.opacity = '0.6';
          } else {
            slider.style.pointerEvents = '';
            slider.style.opacity = '1';
          }
        }
      });
    }

    /**
     * Randomizes all MBTI values
     */
    randomize() {
      if (this.readOnly) return; // Don't randomize in read-only mode

      this.values = this.values.map(() => (Math.random() - 0.5) * 2);

      // Update slider elements
      CONFIG.MBTI.DIMENSIONS.forEach((_, index) => {
        const slider = document.getElementById(`mbti-slider-${index}`);
        if (slider) {
          slider.value = this.values[index];
        }
      });

      this.updateDisplay();

      if (this.onChange) {
        this.onChange([...this.values]);
      }
    }

    /**
     * Sets specific MBTI values
     * @param {Array} newValues - Array of 4 values between -1 and 1
     */
    setValues(newValues) {
      if (newValues.length !== 4) return;

      this.values = newValues.map(v => Math.max(-1, Math.min(1, v)));

      // Update panel slider elements
      CONFIG.MBTI.DIMENSIONS.forEach((_, index) => {
        const slider = document.getElementById(`mbti-slider-${index}`);
        if (slider) {
          slider.value = this.values[index];
        }

        // Also update phone sliders if they exist
        const phoneSlider = document.getElementById(`phone-slider-${index}`);
        if (phoneSlider) {
          phoneSlider.value = this.values[index];
        }
      });

      this.updateDisplay();
      this.updatePhoneDisplay();

      if (this.onChange) {
        this.onChange([...this.values]);
      }
    }

    /**
     * Gets the current MBTI values
     * @returns {Array} Array of 4 values between -1 and 1
     */
    getValues() {
      return [...this.values];
    }

    /**
     * Calculates face shape parameters from MBTI values using the config weights
     * @returns {Object} Object with calculated feature parameters
     */
    calculateFaceParameters() {
      const params = {};

      // Calculate each feature parameter using weighted sum
      Object.keys(CONFIG.MBTI.FEATURE_WEIGHTS).forEach(feature => {
        const weights = CONFIG.MBTI.FEATURE_WEIGHTS[feature];
        let value = 0;

        // Only add weights that exist for this feature
        if (weights.e_i !== undefined) value += weights.e_i * this.values[0];  // E/I dimension
        if (weights.s_n !== undefined) value += weights.s_n * this.values[1];  // S/N dimension  
        if (weights.t_f !== undefined) value += weights.t_f * this.values[2];  // T/F dimension
        if (weights.j_p !== undefined) value += weights.j_p * this.values[3];  // J/P dimension

        params[feature] = value;
      });

      return params;
    }
  }

  FaceApp.MBTIUI = MBTIUI;
})(window);
