// Which way a place should face, so the designed modules (built square, fronts along Minecraft's axes) meet straight
// streets and a square footprint: the angle to turn the place (place.rotate, degrees clockwise seen from above) that
// puts its landmark's footprint, or its neighbourhood's street grid, along the axes. Minecraft can't turn a block by
// anything but a quarter, so the world turns to meet the build, not the build to meet the world.
//   alignment(place, { buildings, streets, toBlock }) -> { rotate, from, detail }
// Angles here are in block coordinates (x east, z south), folded to a quarter turn (-45, 45].
const fold = (a) => { let t = ((a % 90) + 90) % 90; if (t > 45) t -= 90; return t; };

/** The street grid's angle: the length-weighted mode of every segment's direction (folded to a quarter turn, so the
 *  avenues and the cross streets vote together), and how much of the street length lies within 3 degrees of it. */
export function gridAngle(lines) {
  const bins = new Float64Array(360); let total = 0;     // quarter-degree bins over 0..90
  for (const l of lines) for (let i = 1; i < l.length; i++) {
    const dx = l[i][0] - l[i - 1][0], dz = l[i][1] - l[i - 1][1], len = Math.hypot(dx, dz); if (!len) continue;
    const a = ((Math.atan2(dz, dx) * 180) / Math.PI % 90 + 90) % 90; bins[Math.floor(a * 4) % 360] += len; total += len; }
  if (!total) return null;
  // smooth over +-1 degree, take the peak, then the weighted mean around it
  let best = 0, bv = -1;
  for (let i = 0; i < 360; i++) { let v = 0; for (let d = -4; d <= 4; d++) v += bins[(i + d + 360) % 360]; if (v > bv) { bv = v; best = i; } }
  let s = 0, w = 0, near = 0;
  for (let d = -12; d <= 12; d++) { const v = bins[(best + d + 360) % 360]; s += v * (best + d + 0.5) / 4; w += v; near += v; }
  return { angle: fold(s / w), share: near / total };
}

/** A footprint's angle: the turn of its smallest bounding rectangle, and how well a rectangle describes it (its area
 *  over the rectangle's: about 1 for a block, pi/4 for a circle, less for an L or a crescent). */
export function footprintAngle(rings) {
  const pts = rings.flat(); if (pts.length < 3) return null;
  // the polygon's area (shoelace, outer minus holes as given)
  let area = 0; for (const r of rings) { let a = 0; for (let i = 0; i < r.length; i++) { const [x1, z1] = r[i], [x2, z2] = r[(i + 1) % r.length]; a += x1 * z2 - x2 * z1; } area += Math.abs(a) / 2 * (r === rings[0] ? 1 : -1); }
  let best = null;
  for (let t = -45; t < 45; t += 0.25) {
    const c = Math.cos((t * Math.PI) / 180), s = Math.sin((t * Math.PI) / 180); let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [x, z] of pts) { const u = x * c + z * s, v = -x * s + z * c; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
    const box = (u1 - u0) * (v1 - v0); if (!best || box < best.box) best = { t, box };
  }
  return { angle: fold(best.t), fill: area / best.box };
}

/** The place's turn: its landmark's footprint where that is rectangular enough (fill >= 0.8), else the street grid. */
export function alignment(place, { buildings, streets, toBlock }) {
  const rings = (g) => (g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : []).map((r) => r.map(([lo, la]) => toBlock(lo, la)));
  const lines = (g) => (g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : []).map((l) => l.map(([lo, la]) => toBlock(lo, la)));
  const detail = {};
  if (place.landmark && buildings?.length) {
    // the landmark's building: the largest footprint whose box holds the place's centre
    const [cx, cz] = toBlock(place.centre[1], place.centre[0]); let main = null, mainArea = 0;
    for (const f of buildings) { const r = rings(f.geometry); if (!r.length) continue; const xs = r[0].map((p) => p[0]), zs = r[0].map((p) => p[1]);
      if (cx < Math.min(...xs) - 20 || cx > Math.max(...xs) + 20 || cz < Math.min(...zs) - 20 || cz > Math.max(...zs) + 20) continue;
      const a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs)); if (a > mainArea) { mainArea = a; main = r; } }
    const fp = main && footprintAngle(main);
    if (fp) { detail.footprint = { angle: +fp.angle.toFixed(2), fill: +fp.fill.toFixed(2) }; if (fp.fill >= 0.8) return { rotate: +(-fp.angle).toFixed(2), from: "footprint", detail }; }
  }
  const gr = streets?.length ? gridAngle(streets.flatMap((f) => lines(f.geometry))) : null;
  if (gr) { detail.grid = { angle: +gr.angle.toFixed(2), share: +gr.share.toFixed(2) }; return { rotate: +(-gr.angle).toFixed(2), from: "grid", detail }; }
  return { rotate: 0, from: "none", detail };
}
