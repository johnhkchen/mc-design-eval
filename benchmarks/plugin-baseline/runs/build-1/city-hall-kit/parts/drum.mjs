// P6 drum: stylobate and inner ledge, the drum wall with its 16 paired giant columns, eight drum windows, the entablature,
// the stepped attic with its small windows, the urns and the top step (plan rules 24-25; elements 30-33).
// Writes only into air. The window openings are left air for drumWindow() to glaze, and the cells the helper leaves
// unsupported (sill, hood, head) get their own support here.
import { ringFill, doricColumn, drumWindow, drumUrn } from "../vocab.mjs";

const C = 31.5;

// The 16 column corners from the architect's table (plan SITE, drum column cells), each 2 x 2, y 41..61.
const COLUMNS = [
  [37, 10], [40, 11], // NNE 22.5
  [50, 21], [51, 24], // ENE 67.5
  [51, 37], [50, 40], // ESE 112.5
  [40, 50], [37, 51], // SSE 157.5
  [24, 51], [21, 50], // SSW 202.5
  [11, 40], [10, 37], // WSW 247.5
  [10, 24], [11, 21], // WNW 292.5
  [21, 11], [24, 10], // NNW 337.5
];

// Eight window axes, one between each pair of columns: [angle from north, width in cells].
const WINDOWS = [[0, 4], [45, 2], [90, 4], [135, 2], [180, 4], [225, 2], [270, 4], [315, 2]];

// The urns sit on the pair midpoints.
const URN_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

const key = (x, z) => `${x},${z}`;

// The cells of the ring rIn < r <= rOut within width / 2 of the axis at angle (same frame as drumWindow).
function band(angle, width, rIn, rOut) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a), uz = -Math.cos(a);
  const cells = [];
  for (let x = 0; x < 64; x++) for (let z = 0; z < 64; z++) {
    const dx = x - C, dz = z - C;
    const r = Math.hypot(dx, dz), p = dx * uz - dz * ux;
    if (r > rIn && r <= rOut && Math.abs(p) <= width / 2 + 1e-9) cells.push({ x, z, r, p });
  }
  return cells;
}

// The cell of the ring rIn < r <= rOut whose angle from north is nearest deg.
function nearestRingCell(deg, rIn, rOut) {
  let best = null, bestD = Infinity;
  for (let x = 0; x < 64; x++) for (let z = 0; z < 64; z++) {
    const dx = x - C, dz = z - C, r = Math.hypot(dx, dz);
    if (!(r > rIn && r <= rOut)) continue;
    let a = (Math.atan2(dx, -dz) * 180) / Math.PI;
    if (a < 0) a += 360;
    const d = Math.min(Math.abs(a - deg), 360 - Math.abs(a - deg));
    if (d < bestD) { bestD = d; best = { x, z }; }
  }
  return best;
}

// The compass direction from a ring cell toward the dome axis (the back of an inward-facing stair).
function inward(x, z) {
  const dx = x - C, dz = z - C;
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? "west" : "east";
  return dz > 0 ? "north" : "south";
}

export function build(g) {
  // Air-only write, so an earlier part's cell (or one of ours already placed) is refused, not overwritten.
  const put = (x, y, z, block, state) => {
    if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return 0;
    g.set(x, y, z, block, state);
    return 1;
  };

  // Stylobate (r 19.5..22.5, y 37..40) and the inner ledge. The ledge is r 18.5..19.5: the deck under the drum is open
  // over r <= 18.5, so a 17.5..18.5 ledge would hang over the hole.
  ringFill(g, 19.5, 22.5, 37, 39, "polished_diorite");
  ringFill(g, 19.5, 22.5, 40, 40, "smooth_quartz");
  ringFill(g, 18.5, 19.5, 37, 39, "polished_diorite");
  ringFill(g, 18.5, 19.5, 40, 40, "smooth_quartz");

  // The 16 paired giant columns, y 41..61.
  for (const [x0, z0] of COLUMNS) doricColumn(g, x0, z0, 41, 61);
  const colKeys = new Set();
  for (const [x0, z0] of COLUMNS) for (const x of [x0, x0 + 1]) for (const z of [z0, z0 + 1]) colKeys.add(key(x, z));

  // The drum wall (r 18.5..20.5, y 41..61). The window openings (y 43..60) are left air for the windows below.
  const winBands = WINDOWS.map(([a, w]) => band(a, w, 18.5, 21.5));
  const winKeys = new Set(winBands.flat().map((c) => key(c.x, c.z)));
  ringFill(g, 18.5, 20.5, 41, 61, "polished_diorite", (x, y, z) =>
    colKeys.has(key(x, z)) || (y >= 43 && y <= 60 && winKeys.has(key(x, z))));

  // The eight drum windows: glass, sill, round head, hood (drumWindow sets them).
  for (const [a, w] of WINDOWS) drumWindow(g, C, C, a, w, 44);

  // What drumWindow leaves open or unsupported, per window band cell (its edge head stairs and outer hood stay its own):
  //  outer ring y 41..42: a plinth on the stylobate under the outer sill; inner ring y 43: a top-slab sill in the wall, so the glass above stands on a flat top;
  //  y 58: the head's lintel course (the edge stairs are drumWindow's); y 59..60 wall above the head, inner ring only.
  WINDOWS.forEach(([, w], i) => {
    const edgeAt = w / 2 - 1 + 1e-9;
    for (const c of winBands[i]) {
      const outer = c.r > 20.5;
      if (outer) {
        put(c.x, 41, c.z, "polished_diorite");
        put(c.x, 42, c.z, "polished_diorite");
        // The hood's centre cell: drumWindow's bottom slab would carry the top slab at y 60 on air, so a full block takes its place.
        if (Math.abs(c.p) < 1e-9) g.set(c.x, 59, c.z, "smooth_quartz");
      } else {
        put(c.x, 43, c.z, "smooth_quartz_slab", { type: "top" });
      }
      const headEdge = !outer && Math.abs(c.p) > edgeAt;
      if (!headEdge) put(c.x, 58, c.z, "smooth_quartz");
      if (!outer) {
        put(c.x, 59, c.z, "polished_diorite");
        put(c.x, 60, c.z, "polished_diorite");
      }
    }
  });

  // Entablature: architrave (y 62), calcite frieze (y 63), cornice course with inward stairs on the outer ring (y 64).
  ringFill(g, 18.5, 22.5, 62, 62, "smooth_quartz");
  ringFill(g, 18.5, 22.5, 63, 63, "calcite");
  ringFill(g, 18.5, 21.5, 64, 64, "smooth_quartz");
  for (let x = 0; x < 64; x++) for (let z = 0; z < 64; z++) {
    const r = Math.hypot(x - C, z - C);
    if (r > 21.5 && r <= 22.5) put(x, 64, z, "smooth_quartz_stairs", { facing: inward(x, z), half: "top" });
  }

  // Attic step 1 (r 18.5..21.5, y 65..67) with a 2-wide small window at y 66 on each axis: glass on the inner cells.
  const atticBands = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => band(a, 2, 18.5, 21.5));
  const atticKeys = new Set(atticBands.flat().map((c) => key(c.x, c.z)));
  ringFill(g, 18.5, 21.5, 65, 67, "polished_diorite", (x, y, z) => y === 66 && atticKeys.has(key(x, z)));
  const glassKeys = new Set(atticBands.flat().filter((c) => c.r <= 19.5).map((c) => key(c.x, c.z)));
  const linkAt = (x, z) => glassKeys.has(key(x, z)) || (() => {
    const r = Math.hypot(x - C, z - C);
    return r > 18.5 && r <= 21.5 && !atticKeys.has(key(x, z));
  })();
  for (const c of atticBands.flat()) {
    if (c.r > 19.5) continue;
    put(c.x, 66, c.z, "gray_stained_glass_pane", {
      north: String(linkAt(c.x, c.z - 1)),
      south: String(linkAt(c.x, c.z + 1)),
      west: String(linkAt(c.x - 1, c.z)),
      east: String(linkAt(c.x + 1, c.z)),
    });
  }

  // Attic step 2 (r 18.5..20.5, y 68..70) with a smooth_quartz top.
  ringFill(g, 18.5, 20.5, 68, 69, "polished_diorite");
  ringFill(g, 18.5, 20.5, 70, 70, "smooth_quartz");

  // The eight urns over the column pairs, on the outer ring of step 1.
  for (const deg of URN_ANGLES) {
    const cell = nearestRingCell(deg, 20.5, 21.5);
    drumUrn(g, cell.x, cell.z, 68);
  }
}
