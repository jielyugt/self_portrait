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

    // eyes: scaled smaller + slightly higher
    const E = parts.eyes.map(p => ({ x: p.x * 0.6 + 0.2, y: p.y * 0.55 + 0.12 }));
    drawPolyline(pg, E, cx, cy, size, size, { weight: 4 });

    // mouth: scaled + lower
    const M = parts.mouth.map(p => ({ x: p.x * 0.7 + 0.15, y: p.y * 0.35 + 0.45 }));
    drawPolyline(pg, M, cx, cy, size, size, { weight: 4 });
  }

  FaceApp.Renderer = { drawPolyline, composeFace };
})(window);
