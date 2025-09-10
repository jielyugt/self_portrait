// ui.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});
  const { LIB } = FaceApp.Shapes;

  function byId(id) { return document.getElementById(id); }
  function fillSelect(selEl, keys) {
    selEl.innerHTML = '';
    keys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = k.replace(/_/g, ' ');
      selEl.appendChild(opt);
    });
  }
  function randomizeSelect(selEl) {
    selEl.selectedIndex = (Math.random() * selEl.options.length) | 0;
  }

  function initUI(onChange, onExport, onImport, numSets) {
    // Use sliders for each component
    const eyesSlider = byId('eyesSlider');
    const mouthSlider = byId('mouthSlider');
    const headSlider = byId('headSlider');

    // Set slider attributes (1-based for UI)
    [eyesSlider, mouthSlider, headSlider].forEach(sl => {
      sl.min = 1;
      sl.max = numSets;
      sl.value = 1;
      sl.step = 1;
    });

    const eyesSliderValue = byId('eyesSliderValue');
    const mouthSliderValue = byId('mouthSliderValue');
    const headSliderValue = byId('headSliderValue');

    function updateSliderValue(kind, value) {
      const num = Number(value);
      if (kind === 'eyes') eyesSliderValue.textContent = num;
      if (kind === 'mouth') mouthSliderValue.textContent = num;
      if (kind === 'head') headSliderValue.textContent = num;
    }

    eyesSlider.oninput = () => {
      updateSliderValue('eyes', eyesSlider.value);
      console.log('Eyes slider changed:', eyesSlider.value);
      onChange('eyes', parseInt(eyesSlider.value) - 1); // Convert 1-based to 0-based
      if (window.redraw) window.redraw();
    };
    mouthSlider.oninput = () => {
      updateSliderValue('mouth', mouthSlider.value);
      console.log('Mouth slider changed:', mouthSlider.value);
      onChange('mouth', parseInt(mouthSlider.value) - 1); // Convert 1-based to 0-based
      if (window.redraw) window.redraw();
    };
    headSlider.oninput = () => {
      updateSliderValue('head', headSlider.value);
      console.log('Head slider changed:', headSlider.value);
      onChange('head', parseInt(headSlider.value) - 1); // Convert 1-based to 0-based
      if (window.redraw) window.redraw();
    };

    // Initialize values
    updateSliderValue('eyes', eyesSlider.value);
    updateSliderValue('mouth', mouthSlider.value);
    updateSliderValue('head', headSlider.value);

    byId('randomBtn').onclick = () => {
      eyesSlider.value = ((Math.random() * numSets) | 0) + 1; // Generate 1-based value
      mouthSlider.value = ((Math.random() * numSets) | 0) + 1; // Generate 1-based value
      headSlider.value = ((Math.random() * numSets) | 0) + 1; // Generate 1-based value
      updateSliderValue('eyes', eyesSlider.value);
      updateSliderValue('mouth', mouthSlider.value);
      updateSliderValue('head', headSlider.value);
      onChange('eyes', parseInt(eyesSlider.value) - 1); // Convert 1-based to 0-based
      onChange('mouth', parseInt(mouthSlider.value) - 1); // Convert 1-based to 0-based
      onChange('head', parseInt(headSlider.value) - 1); // Convert 1-based to 0-based
    };

    if (onExport) byId('exportBtn').onclick = onExport;
    if (onImport) {
      byId('importBtn').onclick = () => byId('importFile').click();
      byId('importFile').onchange = e => {
        const f = e.target.files[0];
        f && onImport(f);
      };
    }

    return {
      eyes: 0, // Internal values remain 0-based
      mouth: 0,
      head: 0
    };
  }

  FaceApp.UI = { initUI, byId };
})(window);
