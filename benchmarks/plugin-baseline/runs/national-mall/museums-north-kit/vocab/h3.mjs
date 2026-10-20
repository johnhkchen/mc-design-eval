// Helpers for the seven names in plan.md VOCABULARY: corinthianColumn, domeRibbed, thermalWindow, tallWindow, penthouse,
// glassBase, floodBase. Each takes its position as arguments (no spot is hard-wired), writes only inside the footprint
// it returns, and writes only into air unless it is given over: true. Nothing here writes ground, floors or anything
// below its own footprint. Boxes are inclusive, as in plan.md. There are no leaves, and no furniture: plan.md's ROOMS
// are exterior only, so no 2-high clear lane applies.
import { B, DIRS, OPPOSITE, dome } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const key = (x, y, z) => `${x},${y},${z}`;
const PANE = /(^|_)glass_pane$/;
const STAIR_OR_SLAB = /_(stairs|slab)$/;

// Every write goes through here. A cell that already holds a block is refused (an earlier part owns it) unless over is
// set; a helper may overwrite the cells it placed itself (the ribs, the pane states). placed.cells is what landed.
function airOnly(g, { over = false } = {}) {
  const mine = new Map(), refused = [];
  const grid = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        if (!over && !mine.has(key(x, y, z)) && !target.isAir(x, y, z)) refused.push([x, y, z, block]);
        else { target.set(x, y, z, block, state, nbt); mine.set(key(x, y, z), [x, y, z]); }
        return grid;
      };
      if (prop === "owns") return (x, y, z) => mine.has(key(x, y, z));
      if (prop === "placed") return { cells: [...mine.values()], refused };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return grid;
}

// A wall whose front faces `face`: inward points into the wall, along runs along it.
function frame(face) {
  const inward = DIRS[OPPOSITE[face]];
  return { inward, along: inward[2] ? [1, 0, 0] : [0, 0, 1] };
}
// The cell u along the wall, dy up and d deep from the wall-plane cell [x, y, z].
const cellAt = ([x, y, z], f, u, dy, d) => [x + f.along[0] * u + f.inward[0] * d, y + dy, z + f.along[2] * u + f.inward[2] * d];

// Glass panes connect to panes and to solid faces, never to stairs or slabs. Set the four flags of each pane the helper
// placed from what stands beside it, once all of them are down.
function settlePanes(w, cells) {
  for (const [x, y, z] of cells) {
    if (!w.owns(x, y, z)) continue;
    const link = (dx, dz) => {
      const b = w.blockAt(x + dx, y, z + dz).replace(/^minecraft:/, "");
      return b !== "air" && (PANE.test(b) || !STAIR_OR_SLAB.test(b));
    };
    w.set(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0) });
  }
}

/** A Corinthian-style column standing on y (its base slab): quartz_slab base, quartz_pillar shaft, chiseled capital.
 *  Six cells high: base y, shaft y+1..y+4, capital y+5. plan.md: base y 5 at each portico column. */
export function corinthianColumn(g, x, y, z, o = {}) {
  const w = airOnly(g, o);
  w.set(x, y, z, ...B.slab("quartz", "bottom"));
  for (let dy = 1; dy <= 4; dy++) w.set(x, y + dy, z, ...B.pillar("quartz_pillar", "y"));
  w.set(x, y + 5, z, "chiseled_quartz_block", {});
  return w.placed;
}

/** The green copper dome: a hollow oxidized_copper shell on the bottom-centre [cx, cy, cz], base radius `radius`, rising
 *  `rise` cells. Eight oxidized_cut_copper ribs on the axes and diagonals (the outermost dome cell on each ray, every
 *  layer), and two stepped rings at the foot: smooth_quartz at radius + 1 on row cy, quartz_slab at radius + 0.5 on row
 *  cy + 1. plan.md: centre (57, 20, 27), radius 8, rise 7 (top y 26). */
export function domeRibbed(g, [cx, cy, cz], { radius = 8, rise = 7 } = {}) {
  const w = airOnly(g);
  dome(w, {
    center: [cx, cy, cz], radius, height: rise, profile: "hemisphere", block: "oxidized_copper", hollow: true,
    edge: "stairs", stairsBlock: "oxidized_cut_copper_stairs", slabBlock: "oxidized_cut_copper_slab",
  });
  const layers = new Map();
  for (const [x, y, z] of w.placed.cells) { if (!layers.has(y)) layers.set(y, new Set()); layers.get(y).add(`${x},${z}`); }
  const rays = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([a, b]) => [a / Math.hypot(a, b), b / Math.hypot(a, b)]);
  for (const [y, cells] of layers) {
    for (const [ux, uz] of rays) {
      let last = null;
      for (let t = 0; t <= radius + 2; t += 0.25) {
        const x = Math.round(cx + ux * t), z = Math.round(cz + uz * t);
        if (cells.has(`${x},${z}`)) last = [x, z];
      }
      if (last) w.set(last[0], y, last[1], "oxidized_cut_copper", {});
    }
  }
  // Rings at the foot: keep every cell whose distance from the centre is within half a cell of the ring radius.
  const ring = (y, r, place) => {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
      for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++)
        if (Math.abs(Math.hypot(x - cx, z - cz) - r) <= 0.5) place(x, y, z);
  };
  ring(cy, radius + 1, (x, y, z) => w.set(x, y, z, "smooth_quartz", {}));
  // Top slabs, so the dome's edge stairs on row cy + 2 stand flush on them (a bottom slab left half a block of air under).
  ring(cy + 1, radius + 0.5, (x, y, z) => w.set(x, y, z, ...B.slab("quartz", "top")));
  return w.placed;
}

/** The half-round thermal window in a wall plane through [x, y, z] whose front faces `face` (plan.md: the attic at z 40,
 *  facing south). Glass_pane rows y..y+3, 9 wide on the sill row, 7, 5, 3 above; a quartz_stairs voussoir at each end of
 *  each row, facing into the wall with the lip out. plan.md: x = 57 (centre), y = 12, z = 40. */
export function thermalWindow(g, x, y, z, face = "south", o = {}) {
  const w = airOnly(g, o), f = frame(face), base = [x, y, z], glass = [];
  for (const [dy, hw] of [[0, 4], [1, 3], [2, 2], [3, 1]]) {
    for (let u = -hw; u <= hw; u++) { const c = cellAt(base, f, u, dy, 0); w.set(...c, "glass_pane", {}); glass.push(c); }
    for (const u of [-(hw + 1), hw + 1]) w.set(...cellAt(base, f, u, dy, 0), ...B.stairs("quartz", OPPOSITE[face], "top"));
  }
  settlePanes(w, glass);
  return w.placed;
}

/** A tall window: glass_pane `recess` cells behind the wall face, rows y..y+height-1 (default 5 for plan.md's 1 x 5
 *  openings, y 5..9). On the wall face itself: a quartz_slab sill at the bottom row and an upside-down quartz_stairs lintel
 *  at the top row, so the reveal between them stays open. Needs the recess and the reveal cells to be air (the shell
 *  leaves them). plan.md: x = bay centre, y = 5, z = 41 for the south range, face "south". */
export function tallWindow(g, x, y, z, face = "south", { height = 5, recess = 1, over = false } = {}) {
  if (height < 3) throw new Error("tallWindow: height must be at least 3 (sill, glass, lintel)");
  const w = airOnly(g, { over }), f = frame(face), base = [x, y, z], glass = [];
  for (let dy = 0; dy < height; dy++) { const c = cellAt(base, f, 0, dy, recess); w.set(...c, "glass_pane", {}); glass.push(c); }
  w.set(...cellAt(base, f, 0, 0, 0), ...B.slab("quartz", "top"));
  w.set(...cellAt(base, f, 0, height - 1, 0), ...B.stairs("quartz", OPPOSITE[face], "top"));
  settlePanes(w, glass);
  return w.placed;
}

/** The clerestory penthouse on a flat roof: walls of `height` rows from y (default 10, 2 high) on the box x0..x1, z0..z1.
 *  Piers of white_terracotta every 3 cells and at each corner, light_gray_stained_glass ribbon between. Roof on row
 *  y + height: white_terracotta in a ring 2 wide at the edge, smooth_stone inside it, and glass where `skylight` (an
 *  inclusive [x0, x1, z0, z1]) sits. The inside stays air, so the atrium below can light up. plan.md: x 140..164,
 *  z 8..20, y 10, skylight 146..158 x 11..17. */
export function penthouse(g, { x0, x1, z0, z1, y = 10, height = 2, skylight = null, over = false }) {
  const w = airOnly(g, { over });
  const onX = (x) => x === x0 || x === x1, onZ = (z) => z === z0 || z === z1;
  const pier = (v, lo, hi) => (v - lo) % 3 === 0 || v === hi;
  const inSky = (x, z) => skylight && x >= skylight[0] && x <= skylight[1] && z >= skylight[2] && z <= skylight[3];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onX(x) && !onZ(z)) continue;
    const isPier = (onZ(z) && pier(x, x0, x1)) || (onX(x) && pier(z, z0, z1));
    for (let dy = 0; dy < height; dy++) w.set(x, y + dy, z, isPier ? "white_terracotta" : "light_gray_stained_glass", {});
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const inRing = x - x0 < 2 || x1 - x < 2 || z - z0 < 2 || z1 - z < 2;
    const block = inSky(x, z) ? "glass" : inRing ? "white_terracotta" : "smooth_stone";
    w.set(x, y + height, z, block, {});
  }
  return w.placed;
}

/** The base of the Corona (plan.md: the glass base, inset 5, y 4..7): a ring of black_stained_glass with waxed_cut_copper
 *  mullions every 4 cells and at each corner, on the box x0..x1, z0..z1, rows y0..y1. Ochre_froglight ceiling pads on the
 *  inset-1 interior, every 4 cells, on row y1. `leave` is a list of inclusive boxes [x0, y0, z0, x1, y1, z1] that stay
 *  air (the main doors). plan.md: x 193..209, z 5..21, y 4..7, doors at z 21 x 199..203 y 4..5. */
export function glassBase(g, { x0, x1, z0, z1, y0, y1, leave = [], over = false }) {
  const w = airOnly(g, { over });
  const inLeave = (x, y, z) => leave.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);
  const onX = (x) => (x - x0) % 4 === 0 || x === x1, onZ = (z) => (z - z0) % 4 === 0 || z === z1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edgeX = x === x0 || x === x1, edgeZ = z === z0 || z === z1;
    if (!(edgeX || edgeZ) || inLeave(x, y, z)) continue;
    const mullion = (edgeX && onZ(z)) || (edgeZ && onX(x));
    w.set(x, y, z, mullion ? "waxed_cut_copper" : "black_stained_glass", {});
  }
  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++)
    if ((x - x0 - 1) % 4 === 0 && (z - z0 - 1) % 4 === 0) w.set(x, y1, z, "ochre_froglight", { axis: "y" });
  return w.placed;
}

/** Two ochre_froglight floods either side of a column base, on row y, at x - 1 and x + 1 (plan.md: at z 41, y 4, beside
 *  each portico column). They sit in the platform's top row, so the platform needs over: true; without it they are refused. */
export function floodBase(g, x, y, z, o = {}) {
  const w = airOnly(g, o);
  for (const fx of [x - 1, x + 1]) w.set(fx, y, z, "ochre_froglight", { axis: "y" });
  return w.placed;
}
