// shapes.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  const LIB = {
    head: {
      head_front: [
        { x: .15, y: .20 }, { x: .10, y: .35 }, { x: .10, y: .65 }, { x: .20, y: .85 }, { x: .50, y: .95 },
        { x: .80, y: .85 }, { x: .90, y: .65 }, { x: .90, y: .35 }, { x: .85, y: .20 }, { x: .50, y: .10 }, { x: .15, y: .20 }
      ],
      head_left: [
        { x: .25, y: .18 }, { x: .18, y: .35 }, { x: .18, y: .70 }, { x: .30, y: .88 }, { x: .58, y: .95 },
        { x: .88, y: .83 }, { x: .80, y: .65 }, { x: .68, y: .60 }, { x: .70, y: .52 }, { x: .68, y: .45 },
        { x: .65, y: .35 }, { x: .55, y: .25 }, { x: .25, y: .18 }
      ],
      head_right: [] // mirrored at init
    },
    eyes: {
      eyes_open:  [ {x:.35,y:.45},{x:.43,y:.44},{x:.51,y:.45},{x:.43,y:.46},{x:.35,y:.45} ],
      eyes_closed:[ {x:.33,y:.47},{x:.43,y:.49},{x:.53,y:.47} ],
      eyes_dreamy:[ {x:.33,y:.46},{x:.38,y:.44},{x:.43,y:.43},{x:.48,y:.44},{x:.53,y:.46},
                    {x:.48,y:.485},{x:.43,y:.495},{x:.38,y:.485},{x:.33,y:.46} ]
    },
    mouth: {
      mouth_neutral: [ {x:.35,y:.70},{x:.50,y:.72},{x:.65,y:.70} ],
      mouth_smile:   [ {x:.33,y:.70},{x:.40,y:.75},{x:.50,y:.78},{x:.60,y:.75},{x:.67,y:.70} ],
      mouth_open:    [ {x:.38,y:.70},{x:.50,y:.74},{x:.62,y:.70},{x:.50,y:.76},{x:.38,y:.70} ]
    }
  };

  // mirror head_right
  LIB.head.head_right = LIB.head.head_left.map(p => ({ x: 1 - p.x, y: p.y }));

  // Export/Import helpers
  function exportJSON() {
    const data = { head: LIB.head, eyes: LIB.eyes, mouth: LIB.mouth };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'face_shapes.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSONFile(file, onDone, onError) {
    const r = new FileReader();
    r.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.head || !data.eyes || !data.mouth) throw new Error('Missing keys');
        // overwrite
        const head = data.head, eyes = data.eyes, mouth = data.mouth;
        // mirror right head if needed
        if (!head.head_right && head.head_left) {
          head.head_right = head.head_left.map(p => ({ x: 1 - p.x, y: p.y }));
        }
        LIB.head = head; LIB.eyes = eyes; LIB.mouth = mouth;
        onDone && onDone();
      } catch (err) {
        onError && onError(err);
      }
    };
    r.readAsText(file);
  }

  FaceApp.Shapes = { LIB, exportJSON, importJSONFile };
})(window);
