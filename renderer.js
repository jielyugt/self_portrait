// renderer.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  function drawPolyline(pg, pts, cx, cy, w, h, opts = {}) {
    const { close = false, weight = 4, stroke = 20 } = opts;
    pg.push();
    pg.translate(cx, cy);
    pg.noFill();
    pg.stroke(stroke);
    pg.strokeWeight(weight);
    pg.beginShape();
    for (const p of pts) {
      pg.vertex((p.x - 0.5) * w, (p.y - 0.5) * h);
    }
    if (close) pg.endShape(pg.CLOSE); else pg.endShape();
    pg.pop();
  }

  // Compose components
  function composeFace(pg, parts, cx, cy, size) {
    // head (1:1)
    drawPolyline(pg, parts.head, cx, cy, size, size, { weight: 4 });

    // left eye: scaled and positioned (50% bigger: 0.6 * 1.5 = 0.9)
    const leftE = parts.left_eye.map(p => ({ x: p.x * 0.9 + 0.05, y: p.y * 0.825 + 0.0375 }));
    drawPolyline(pg, leftE, cx, cy, size, size, { weight: 4 });

    // right eye: scaled and positioned (50% bigger: 0.6 * 1.5 = 0.9)
    const rightE = parts.right_eye.map(p => ({ x: p.x * 0.9 + 0.05, y: p.y * 0.825 + 0.0375 }));
    drawPolyline(pg, rightE, cx, cy, size, size, { weight: 4 });

    // mouth: scaled + lower (50% bigger: 0.7 * 1.5 = 1.05)
    const M = parts.mouth.map(p => ({ x: p.x * 1.05 - 0.025, y: p.y * 0.525 + 0.3375 }));
    drawPolyline(pg, M, cx, cy, size, size, { weight: 4 });
  }

  FaceApp.Renderer = { drawPolyline, composeFace };
})(window);
