// Pike Place vocabulary, part 3: the eight plan.md helpers that set block states the others leave out.
// Each helper takes its own position (and facing) as arguments and writes only inside the footprint those
// arguments define, only into air. quoins is the one exception: it replaces the brick it corners (over, default on).
// Block ids are plan.md's PALETTE, checked on 1.21.1; iron chain is `chain` there, not `iron_chain`.
import { bannerWord as placeBannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
// For a street face: `out` steps away from the wall, `along` steps from the viewer's left to the right.
const AXES = {
  west: { out: [-1, 0, 0], along: [0, 0, 1] },
  east: { out: [1, 0, 0], along: [0, 0, -1] },
  north: { out: [0, 0, -1], along: [-1, 0, 0] },
  south: { out: [0, 0, 1], along: [1, 0, 0] },
};
const NO_ARMS = { north: "false", east: "false", south: "false", west: "false" };

// Inclusive box [x0, y0, z0, x1, y1, z1] around the given points.
const boxOf = (...pts) => [
  ...[0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i]))),
  ...[0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i]))),
];
const inBox = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];

// Write one block if the cell is inside the footprint and is air (or `over`). Returns 1 when written.
function put(g, box, [x, y, z], block, state = {}, { over = false } = {}) {
  if (!inBox(box, [x, y, z]) || (!over && !g.isAir(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// The cell i steps along the wall from `at`, j up, n out from the wall.
const cellOn = (at, ax, i, j, n = 0) => [
  at[0] + ax.along[0] * i + ax.out[0] * n,
  at[1] + j,
  at[2] + ax.along[2] * i + ax.out[2] * n,
];

/** Corner quoins up the column [x, z] from y0 to y1: smooth_sandstone 2 long along both walls on even courses, 1 long on odd. */
export function quoins(g, [x, z], y0, y1, { dirs = [1, 1], over = true } = {}) {
  const [sx, sz] = dirs, box = boxOf([x, y0, z], [x + sx, y1, z + sz]);
  let n = 0;
  for (let y = y0; y <= y1; y++) {
    n += put(g, box, [x, y, z], "smooth_sandstone", {}, { over });
    if ((y - y0) % 2 === 0) {
      n += put(g, box, [x + sx, y, z], "smooth_sandstone", {}, { over });
      n += put(g, box, [x, y, z + sz], "smooth_sandstone", {}, { over });
    }
  }
  return n;
}

/** Window frame one cell proud of the wall around a w x h opening; `at` is its lower-left cell seen from the street. */
export function windowFrame(g, { at, face: f, w = 2, h = 5, sill = "quartz_slab", head = "brick_stairs" }) {
  const ax = AXES[f], box = boxOf(cellOn(at, ax, -1, -1, 1), cellOn(at, ax, w, h, 1));
  const headState = head.endsWith("_stairs") ? { facing: OPPOSITE[f], half: "top", shape: "straight" } : {};
  const sillState = sill.endsWith("_slab") ? { type: "top" } : {};
  let n = 0;
  for (let i = -1; i <= w; i++) for (let j = -1; j <= h; j++) {
    if (i > -1 && i < w && j > -1 && j < h) continue; // the opening's proud layer stays air
    const p = cellOn(at, ax, i, j, 1);
    if (j === h) n += put(g, box, p, head, headState);
    else if (j === -1) n += put(g, box, p, sill, sillState);
    else n += put(g, box, p, "smooth_quartz");
  }
  return n;
}

/** Cornice row at height y on the outer column of the box x0..x1 x z0..z1 (one proud of the wall), stairs lip out, bricks dentils under every other block. */
export function cornice(g, { x0, x1, z0, z1, y, face: f, dentils = true, material = "smooth_sandstone" }) {
  const ew = f === "east" || f === "west";
  const c = f === "west" ? x0 : f === "east" ? x1 : f === "north" ? z0 : z1;
  const box = ew ? boxOf([c, y - 1, z0], [c, y, z1]) : boxOf([x0, y - 1, c], [x1, y, c]);
  const at = (t, yy) => (ew ? [c, yy, t] : [t, yy, c]);
  const lo = ew ? z0 : x0, hi = ew ? z1 : x1;
  let n = 0;
  for (let t = lo; t <= hi; t++) {
    n += put(g, box, at(t, y), `${material}_stairs`, { facing: OPPOSITE[f], half: "top", shape: "straight" });
    if (dentils && (t - lo) % 2 === 0) n += put(g, box, at(t, y - 1), "bricks");
  }
  return n;
}

/** Banner letters reading left to right from the street, centred on `center`; only the row the word covers, only into air. */
export function bannerWord(g, word, { center, face: f = "south", letter = "red", base = "white" }) {
  const alongX = f === "north" || f === "south", n = [...String(word)].length, half = (n - 1) / 2;
  const ks = [...Array(n).keys()].map((i) => Math.round(i - half));
  const lo = Math.min(...ks), hi = Math.max(...ks);
  const box = alongX
    ? [center[0] + lo, center[1], center[2], center[0] + hi, center[1], center[2]]
    : [center[0], center[1], center[2] + lo, center[0], center[1], center[2] + hi];
  let placed = 0;
  const view = {
    get: (x, y, z) => g.get(x, y, z),
    set: (x, y, z, block, state, nbt) => {
      if (!inBox(box, [x, y, z]) || !g.isAir(x, y, z)) return;
      g.set(x, y, z, block, state, nbt);
      placed++;
    },
  };
  placeBannerWord(view, word, { center, face: f, letter, base });
  return placed;
}

/** Street lamp: stone_bricks base in the first cell above ground at `at`, h spruce fence posts, a standing lantern on top. */
export function lampPost(g, { at, h = 4 }) {
  const [x, y, z] = at, box = boxOf(at, [x, y + h + 1, z]);
  let n = put(g, box, at, "stone_bricks");
  for (let k = 1; k <= h; k++) n += put(g, box, [x, y + k, z], "spruce_fence", NO_ARMS);
  return n + put(g, box, [x, y + h + 1, z], "lantern", { hanging: "false" });
}

/** Lantern at `at` hung on `drop` chain links from the block drop + 1 cells above (the arch crown). Places nothing if that block is air. */
export function hangingLantern(g, { at, drop = 1 }) {
  const [x, y, z] = at;
  if (g.isAir(x, y + drop + 1, z)) return 0;
  const box = boxOf(at, [x, y + drop, z]);
  let n = put(g, box, at, "lantern", { hanging: "true" });
  for (let k = 1; k <= drop; k++) n += put(g, box, [x, y + k, z], "chain", { axis: "y" });
  return n;
}

/** Rooftop vent: a 2 x 2 x 2 light_gray_concrete box from its low corner `at`, stone_brick_slab lid on top. */
export function rooftopVent(g, { at }) {
  const [x, y, z] = at, box = boxOf(at, [x + 1, y + 2, z + 1]);
  let n = 0;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    for (let dy = 0; dy < 2; dy++) n += put(g, box, [x + dx, y + dy, z + dz], "light_gray_concrete");
    n += put(g, box, [x + dx, y + 2, z + dz], "stone_brick_slab", { type: "bottom" });
  }
  return n;
}

/**
 * Fire escape across x0..x1 x z0..z1 (z1 side against the building): polished_blackstone_slab landings at
 * landings[0] and [1], iron_bars rails one up on the open sides, a stair flight rising east between them (its
 * outer rail along z0), and a ladder down the z1 end to ladderTo, facing out, back to the building.
 * Writes only air, so a landing, step or rail that is already built is left as it is.
 */
export function fireEscape(g, { x0, x1, z0, z1, landings = [8, 14], ladderTo = 3 }) {
  const [lo, hi] = landings, box = boxOf([x0, ladderTo, z0], [x1, hi + 1, z1]);
  let n = 0;
  for (const L of [lo, hi]) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    n += put(g, box, [x, L, z], "polished_blackstone_slab", { type: "top" });
  const steps = hi - lo - 1;
  for (let k = 1; k <= steps; k++) for (let z = z0; z <= z1; z++)
    n += put(g, box, [x0 + k - 1, lo + k, z], "polished_blackstone_stairs", { facing: "east", half: "bottom", shape: "straight" });
  // rail cells: open sides of each landing (the z0 edge and both ends), and the flight's outer rail
  const rail = new Set();
  for (const L of [lo, hi]) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    if (z === z0 || x === x0 || x === x1) rail.add([x, L + 1, z].join());
  for (let k = 1; k <= steps; k++) rail.add([x0 + k - 1, lo + k + 1, z0].join());
  for (const key of rail) {
    const [x, y, z] = key.split(",").map(Number), has = (dx, dz) => rail.has([x + dx, y, z + dz].join());
    n += put(g, box, [x, y, z], "iron_bars", {
      north: String(has(0, -1)), south: String(has(0, 1)), west: String(has(-1, 0)), east: String(has(1, 0)),
    });
  }
  for (let y = lo; y >= ladderTo; y--) n += put(g, box, [x1, y, z1], "ladder", { facing: "north" });
  return n;
}
