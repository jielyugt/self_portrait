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

  function initUI(onChange, onExport, onImport) {
    const eyesSel = byId('eyesSel');
    const mouthSel = byId('mouthSel');
    const headSel = byId('headSel');

    fillSelect(eyesSel, Object.keys(LIB.eyes));
    fillSelect(mouthSel, Object.keys(LIB.mouth));
    fillSelect(headSel, Object.keys(LIB.head));

    eyesSel.value = 'eyes_open';
    mouthSel.value = 'mouth_neutral';
    headSel.value = 'head_front';

    eyesSel.onchange  = () => onChange('eyes',  eyesSel.value);
    mouthSel.onchange = () => onChange('mouth', mouthSel.value);
    headSel.onchange  = () => onChange('head',  headSel.value);

    byId('randomBtn').onclick = () => {
      randomizeSelect(eyesSel);  onChange('eyes',  eyesSel.value);
      randomizeSelect(mouthSel); onChange('mouth', mouthSel.value);
      randomizeSelect(headSel);  onChange('head',  headSel.value);
    };

    byId('exportBtn').onclick = onExport;
    byId('importBtn').onclick = () => byId('importFile').click();
    byId('importFile').onchange = e => {
      const f = e.target.files[0];
      f && onImport(f);
    };

    return {
      eyes: eyesSel.value,
      mouth: mouthSel.value,
      head: headSel.value
    };
  }

  FaceApp.UI = { initUI, byId };
})(window);
