// Part 3, Atlas and armillary sphere: the kneeling figure on its plinth, the pylons, the four crossing rings and the
// tilted ecliptic band of the sphere, the axis with its lightning-rod stubs, and the ochre uplights in the paving.
// Centre of the sphere (67, 16, 27.5); the figure's envelope x 65..69, z 25..30, y 6..15 (plan.md ATLAS).
import {
  BRONZE, COPPER, LIGHTNING_ROD,
  atlas_figure, plinth, pylon, ring_circle, ring_ellipse,
} from "../vocab.mjs";

const CENTRE = [67, 16, 27.5];

// one tilted ring (a great-circle-like ellipse) through the centre: semi-axis a along unit vector ex, semi-axis b along
// unit vector u; sampled densely and rounded, so the band is continuous and one block thick
function ringTilted(g, c, ex, u, a, b, mat, steps = 900) {
  const cells = new Map();
  for (let i = 0; i < steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const p = [0, 1, 2].map((k) => c[k] + a * Math.cos(t) * ex[k] + b * Math.sin(t) * u[k]);
    const cell = p.map((v) => Math.round(v));
    cells.set(cell.join(","), cell);
  }
  for (const cell of cells.values()) g.set(cell[0], cell[1], cell[2], mat);
  return cells.size;
}

// the axis: a straight run from (67,12,24) to (67,20,31), face-connected, with a lightning-rod stub one cell beyond each end
function axis(g, p0, p1, mat, stubMat) {
  const d = p1.map((v, k) => v - p0[k]);
  const len = Math.hypot(...d);
  const dir = d.map((v) => v / len);
  const cells = new Map();
  let prev = null;
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const cell = p0.map((v, k) => Math.round(v + (d[k] * i) / steps));
    // fill the gap to the previous cell so the rod has no diagonal breaks
    if (prev) {
      const n = Math.max(...prev.map((v, k) => Math.abs(cell[k] - v)));
      for (let s = 1; s < n; s++) {
        const mid = prev.map((v, k) => Math.round(v + ((cell[k] - v) * s) / n));
        cells.set(mid.join(","), mid);
      }
    }
    cells.set(cell.join(","), cell);
    prev = cell;
  }
  for (const cell of cells.values()) g.set(cell[0], cell[1], cell[2], mat);
  const stubA = p0.map((v, k) => Math.round(v - dir[k]));
  const stubB = p1.map((v, k) => Math.round(v + dir[k]));
  g.set(stubA[0], stubA[1], stubA[2], stubMat);
  g.set(stubB[0], stubB[1], stubB[2], stubMat);
  return cells.size + 2;
}

export function build(g) {
  // the granite plinth: base y2, body y3..4, cap y5, under the figure
  plinth(g, { x0: 64, z0: 24, x1: 70, z1: 31, y0: 2 });

  // the two granite pylons, 3 wide by 2 deep, from y2 to coping y17
  pylon(g, 66, 20, 2);
  pylon(g, 66, 34, 2);

  // the kneeling Atlas: brown terracotta body, weathered copper highlights
  atlas_figure(g, { x: 65, y: 6, z: 25 });

  // the armillary sphere: four rings of bronze and copper, all centred on CENTRE
  // ring 1: meridian in the y-z plane at x 67, facing Fifth Avenue
  ring_ellipse(g, CENTRE, "yz", 4, 4.5, BRONZE);
  // ring 2: equator in the x-z plane at y 16
  ring_ellipse(g, CENTRE, "xz", 4, 4.5, BRONZE);
  // ring 3: meridian in the x-y plane, two layers thick at z 27 and 28
  ring_circle(g, CENTRE, "z", 4, BRONZE, { at: 27, thick: 2 });
  // ring 4: ecliptic band, tilted from low at z 23 (y 13) to high at z 32 (y 19), in copper of a different tone
  const u = [0, 6, 9].map((v) => v / Math.hypot(0, 6, 9));
  ringTilted(g, CENTRE, [1, 0, 0], u, 4, 5.4, COPPER);

  // the axis through the centre, with lightning-rod stubs beyond the rings
  axis(g, [67, 12, 24], [67, 20, 31], BRONZE, LIGHTNING_ROD);

  // the six ochre uplights in the paving (63,1,23) (63,1,32) (71,1,23) (71,1,32) (69,1,20) (69,1,35) are not placed here:
  // the portal part paves every forecourt cell at y 1 before this part runs, and earlier parts are locked. They need
  // portal.mjs to leave those six cells unpaved (plan.md reserves them), then uplight() can sit flush in the ground course.
}
