/**
 * UI module for traditional slider-based interface
 * Note: Currently not used in the main app, which uses the hexagon interface instead
 * Kept for potential future development or alternative interface modes
 */
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { LIB } = FaceApp.Shapes;
  const { CONFIG } = FaceApp;

  /**
   * Helper function to get element by ID
   * @param {string} id - Element ID
   * @returns {HTMLElement} DOM element
   */
  function byId(id) {
    return document.getElementById(id);
  }

  /**
   * Fills a select element with options from an array of keys
   * @param {HTMLSelectElement} selEl - Select element to populate
   * @param {Array} keys - Array of option keys
   */
  function fillSelect(selEl, keys) {
    selEl.innerHTML = '';
    keys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k.replace(/_/g, ' '); // Convert underscores to spaces
      selEl.appendChild(opt);
    });
  }

  /**
   * Selects a random option in a select element
   * @param {HTMLSelectElement} selEl - Select element to randomize
   */
  function randomizeSelect(selEl) {
    selEl.selectedIndex = (Math.random() * selEl.options.length) | 0;
  }

  /**
   * Initializes the traditional slider-based UI
   * @param {Function} onChange - Callback for value changes
   * @param {Function} onExport - Callback for export action
   * @param {Function} onImport - Callback for import action  
   * @param {number} numSets - Number of face sets available
   * @returns {Object} Initial UI state
   */
  function initUI(onChange, onExport, onImport, numSets) {
    // Get slider elements (if they exist)
    const eyesSlider = byId('eyesSlider');
    const mouthSlider = byId('mouthSlider');
    const headSlider = byId('headSlider');

    // Early return if sliders don't exist (current app doesn't use them)
    if (!eyesSlider || !mouthSlider || !headSlider) {
      console.log('Traditional UI sliders not found - using hexagon interface');
      return { eyes: 0, mouth: 0, head: 0 };
    }

    // Configure slider attributes (1-based for UI display)
    [eyesSlider, mouthSlider, headSlider].forEach(slider => {
      slider.min = 1;
      slider.max = numSets;
      slider.value = 1;
      slider.step = 1;
    });

    // Get value display elements
    const eyesSliderValue = byId('eyesSliderValue');
    const mouthSliderValue = byId('mouthSliderValue');
    const headSliderValue = byId('headSliderValue');

    /**
     * Updates slider value display
     * @param {string} kind - Component type ('eyes', 'mouth', 'head')
     * @param {string|number} value - New value
     */
    function updateSliderValue(kind, value) {
      const num = Number(value);
      if (kind === 'eyes' && eyesSliderValue) eyesSliderValue.textContent = num;
      if (kind === 'mouth' && mouthSliderValue) mouthSliderValue.textContent = num;
      if (kind === 'head' && headSliderValue) headSliderValue.textContent = num;
    }

    // Setup event handlers
    eyesSlider.oninput = () => {
      updateSliderValue('eyes', eyesSlider.value);
      onChange('eyes', parseInt(eyesSlider.value) - 1); // Convert to 0-based
      if (window.redraw) window.redraw();
    };

    mouthSlider.oninput = () => {
      updateSliderValue('mouth', mouthSlider.value);
      onChange('mouth', parseInt(mouthSlider.value) - 1); // Convert to 0-based
      if (window.redraw) window.redraw();
    };

    headSlider.oninput = () => {
      updateSliderValue('head', headSlider.value);
      onChange('head', parseInt(headSlider.value) - 1); // Convert to 0-based
      if (window.redraw) window.redraw();
    };

    // Initialize display values
    updateSliderValue('eyes', eyesSlider.value);
    updateSliderValue('mouth', mouthSlider.value);
    updateSliderValue('head', headSlider.value);

    // Setup randomize button
    const randomBtn = byId('randomBtn');
    if (randomBtn) {
      randomBtn.onclick = () => {
        eyesSlider.value = ((Math.random() * numSets) | 0) + 1;
        mouthSlider.value = ((Math.random() * numSets) | 0) + 1;
        headSlider.value = ((Math.random() * numSets) | 0) + 1;

        updateSliderValue('eyes', eyesSlider.value);
        updateSliderValue('mouth', mouthSlider.value);
        updateSliderValue('head', headSlider.value);

        onChange('eyes', parseInt(eyesSlider.value) - 1);
        onChange('mouth', parseInt(mouthSlider.value) - 1);
        onChange('head', parseInt(headSlider.value) - 1);
      };
    }

    // Setup export/import buttons
    const exportBtn = byId('exportBtn');
    if (onExport && exportBtn) {
      exportBtn.onclick = onExport;
    }

    const importBtn = byId('importBtn');
    const importFile = byId('importFile');
    if (onImport && importBtn && importFile) {
      importBtn.onclick = () => importFile.click();
      importFile.onchange = e => {
        const file = e.target.files[0];
        if (file) onImport(file);
      };
    }

    // Return initial state (0-based internally)
    return {
      eyes: 0,
      mouth: 0,
      head: 0
    };
  }

  // Export public interface
  FaceApp.UI = {
    initUI,
    byId,
    fillSelect,
    randomizeSelect
  };
})(window);
