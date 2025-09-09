// morph.js
(function (root) {
  const FaceApp = (root.FaceApp = root.FaceApp || {});

  // ---------- utils ----------
  const clone = o => JSON.parse(JSON.stringify(o));
  function lerpPt(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy); }

  // Resample a polyline to N points (uniform arclength)
  function resample(points, N) {
    if (!points || !points.length) return [];
    let P = clone(points);
    let L = 0;
    for (let i = 1; i < P.length; i++) L += dist2(P[i - 1], P[i]);
    if (L === 0) return Array.from({ length: N }, () => clone(P[0]));
    const step = L / (N - 1);
    const out = [clone(P[0])];
    let accum = 0, i = 1;
    let prev = clone(P[0]);
    while (out.length < N) {
      if (i >= P.length) { out.push(clone(P[P.length - 1])); continue; }
      const curr = P[i];
      const segLen = dist2(prev, curr);
      if (accum + segLen >= step) {
        const need = step - accum;
        const t = need / segLen;
        const nx = prev.x + (curr.x - prev.x) * t;
        const ny = prev.y + (curr.y - prev.y) * t;
        const newPt = { x: nx, y: ny };
        out.push(newPt);
        prev = newPt;
        P.splice(i, 0, newPt);
        accum = 0;
      } else {
        accum += segLen;
        prev = curr;
        i++;
      }
    }
    return out;
  }

  // Easing
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  // ---------- Morph class ----------
  class Morph {
    constructor(variants, key, count = 64, durationSec = 0.6) {
      this.variants = variants; // { key: [{x,y}, ...] }
      this.N = count;
      this.curr = resample(variants[key], this.N);
      this.target = resample(variants[key], this.N);
      this.t = 1;
      this.dur = durationSec;
    }
    setTarget(key) {
      this.target = resample(this.variants[key], this.N);
      this.t = 0;
    }
    update(dt) {
      if (this.t < 1) this.t = Math.min(1, this.t + dt / this.dur);
    }
    points() {
      if (this.t >= 1) return this.target;
      const e = easeOutCubic(this.t);
      return this.curr.map((p, i) => lerpPt(p, this.target[i], e));
    }
    commitIfDone() {
      if (this.t >= 1) this.curr = this.target.map(p => ({ ...p }));
    }
  }

  FaceApp.utils = { resample, lerpPt, clone };
  FaceApp.Morph = Morph;
})(window);
