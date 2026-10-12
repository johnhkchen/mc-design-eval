// Helpers for the midcentury house, batch h1 (plan.md VOCABULARY). Each takes its position (and facing) as arguments.
// Every write goes through put(): only into air, so a cell an earlier part filled is skipped and reported, never
// overwritten. Nothing here writes ground, sand or floor under its footprint. Each helper returns
// { placed, skipped: [[x, y, z, block]] }. Coordinates are plan.md's absolute ones.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const range = (a, b) => {
  const lo = Math.min(a, b);
  return Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => lo + i);
};
const newOut = () => ({ placed: 0, skipped: [] });
const inBox = (x, z, [x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const dirName = ([dx, , dz]) => Object.keys(DIRS).find((k) => DIRS[k][0] === dx && DIRS[k][2] === dz);

// the one write path: air only
function put(g, o, x, y, z, [block, state, nbt]) {
  if (!g.isAir(x, y, z)) {
    o.skipped.push([x, y, z, block]);
    return;
  }
  g.set(x, y, z, block, state, nbt);
  o.placed++;
}

// Exterior --------------------------------------------------------------------------------------------------------

/** White stucco fill over the box x0..x1, z0..z1, y0..y1 (plan: y=2..4). */
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4) {
  const o = newOut();
  for (const x of range(x0, x1)) for (const z of range(z0, z1)) for (const y of range(y0, y1)) {
    put(g, o, x, y, z, ["white_concrete", {}]);
  }
  return o;
}

/**
 * A sliding-door opening, width cells along x from x0 at row z: air at y0..y0+1 (never closed), glass_pane at y0+2.
 * Anything standing in the opening is reported as skipped instead of being removed.
 */
export function slider_gap(g, x0, z, y0 = 2, width = 2) {
  const o = newOut();
  for (const x of range(x0, x0 + width - 1)) {
    for (const y of [y0, y0 + 1]) {
      if (!g.isAir(x, y, z)) o.skipped.push([x, y, z, g.blockAt(x, y, z)]);
    }
    put(g, o, x, y0 + 2, z, B.pane());
  }
  return o;
}

// Plan holes in the roof band: the atrium (x 17..21, z 12..17) and the chimney (x 20..21, z 21..22).
const ATRIUM_HOLE = [17, 21, 12, 17];
const CHIMNEY_HOLE = [20, 21, 21, 22];

/** The eave/ridge slab band over x=9..32 at rows zA..zB, half = "bottom" | "top"; skips the atrium and chimney holes. */
export function roof_band(g, zA, zB, y, half) {
  if (half !== "bottom" && half !== "top") throw new Error(`roof_band: half must be bottom or top, got ${half}`);
  const o = newOut();
  for (const x of range(9, 32)) for (const z of range(zA, zB)) {
    if (inBox(x, z, ATRIUM_HOLE) || inBox(x, z, CHIMNEY_HOLE)) continue;
    put(g, o, x, y, z, B.slab("smooth_stone", half));
  }
  return o;
}

/** Checkerboard breeze screen: white_concrete where (x + y) is even, air elsewhere, over x0..x1, y0..y1 at row z. */
export function breeze_screen(g, x0, x1, y0, y1, z) {
  const o = newOut();
  for (const x of range(x0, x1)) for (const y of range(y0, y1)) {
    if ((x + y) % 2 === 0) put(g, o, x, y, z, ["white_concrete", {}]);
  }
  return o;
}

// jungle_log trunk y=1..7; leaves at y=7 (the 3x3 ring) and y=6 (a radius-2 cross plus the diagonals)
const CROWN_Y6 = [[1, 0], [2, 0], [-1, 0], [-2, 0], [0, 1], [0, 2], [0, -1], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** A palm at (x, z): trunk y=1..7 and a crown; leaves persistent; cells already filled (e.g. by the roof) are skipped. */
export function palm(g, x, z) {
  const o = newOut();
  const leaves = ["jungle_leaves", { persistent: "true" }];
  for (let y = 1; y <= 7; y++) put(g, o, x, y, z, B.log("jungle", "y"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (dx || dz) put(g, o, x + dx, 7, z + dz, leaves);
  }
  for (const [dx, dz] of CROWN_Y6) put(g, o, x + dx, 6, z + dz, leaves);
  return o;
}

/**
 * The kidney pool over the footprint `cells` (an array of [x, z]; plan.md RESERVED). Floor light_blue_concrete at y=-2
 * on every pool cell; liner walls light_blue_concrete at y=-1 on the rim (pool cells with a non-pool neighbour);
 * water at y=-1 inside the rim and y=0 everywhere; smooth_quartz_slab bottom coping at y=0 on each non-pool cell next
 * to the pool. Coping that lands on paved deck is skipped and reported (the deck belongs to the paving part).
 */
export function kidney_pool(g, cells) {
  const o = newOut();
  const key = (x, z) => `${x},${z}`;
  const pool = new Set(cells.map(([x, z]) => key(x, z)));
  const inPool = (x, z) => pool.has(key(x, z));
  const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const deck = new Map();
  const liner = ["light_blue_concrete", {}];
  const water = ["water", {}];
  for (const [x, z] of cells) {
    let rim = false;
    for (const [dx, dz] of NEIGHBOURS) {
      if (inPool(x + dx, z + dz)) continue;
      rim = true;
      deck.set(key(x + dx, z + dz), [x + dx, z + dz]);
    }
    put(g, o, x, -2, z, liner);
    put(g, o, x, -1, z, rim ? liner : water);
    put(g, o, x, 0, z, water);
  }
  for (const [x, z] of deck.values()) put(g, o, x, 0, z, B.slab("smooth_quartz", "bottom"));
  return o;
}

// Interior --------------------------------------------------------------------------------------------------------

/**
 * A lantern hung from the block at (x, y + 1, z) (plan: y=4 under a beam or the ceiling at y=5). Refuses when nothing
 * is above it to hang from, rather than floating the lantern.
 */
export function hung_lantern(g, x, z, y = 4) {
  const o = newOut();
  if (g.isAir(x, y + 1, z)) {
    o.skipped.push([x, y, z, "lantern"]);
    o.reason = `no block at y=${y + 1} to hang from`;
    return o;
  }
  put(g, o, x, y, z, B.lantern(true));
  return o;
}

/**
 * Egg chair: seat stairs at (x, 2, z) that the sitter faces along `facing` (the seat's solid back points the other way);
 * an open iron_trapdoor back at the cell behind the seat, y=2 and y=3; one open iron_trapdoor on each side at y=2.
 * The cell in front of the seat is left clear.
 */
export function egg_chair(g, x, z, facing) {
  const d = DIRS[facing];
  if (!d) throw new Error(`egg_chair: facing must be north, south, east or west, got ${facing}`);
  const o = newOut();
  const [bx, bz] = [x - d[0], z - d[2]];          // behind the seat
  const [px, pz] = [d[2], d[0]];                  // across the seat
  put(g, o, x, 2, z, B.stairs("smooth_red_sandstone", OPPOSITE[facing], "bottom", "straight"));
  for (const y of [2, 3]) put(g, o, bx, y, bz, B.trapdoor("iron", facing, "bottom", true));
  for (const s of [1, -1]) {
    put(g, o, x + px * s, 2, z + pz * s, B.trapdoor("iron", dirName([-px * s, 0, -pz * s]), "bottom", true));
  }
  return o;
}

/**
 * Freestanding fireplace stack on the 2x2 footprint whose low corner is (x0, z0) (plan Part 3: x=20..21, z=21..22):
 * y=1 mud_bricks; y=2 lit campfires down the x0 column, mud_bricks on the other; y=3 mud_bricks lintel; y=4..7 black
 * concrete flue; y=8 smooth_stone_slab cap.
 */
export function fireplace_stack(g, x0, z0) {
  const o = newOut();
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const x = x0 + dx, z = z0 + dz;
    put(g, o, x, 1, z, ["mud_bricks", {}]);
    put(g, o, x, 2, z, dx === 0 ? ["campfire", { lit: "true" }] : ["mud_bricks", {}]);
    put(g, o, x, 3, z, ["mud_bricks", {}]);
    for (let y = 4; y <= 7; y++) put(g, o, x, y, z, ["black_concrete", {}]);
    put(g, o, x, 8, z, B.slab("smooth_stone", "bottom"));
  }
  return o;
}

/**
 * Two-high wardrobe, `len` cells long from (x, z) along `axis` ("x" or "z"): spruce_planks at the back row and open
 * spruce_trapdoor fronts on the row in front, facing `facing` (default south for axis x, west for axis z). The
 * footprint is two cells deep.
 */
export function wardrobe(g, x, z, len, axis = "x", facing) {
  if (axis !== "x" && axis !== "z") throw new Error(`wardrobe: axis must be x or z, got ${axis}`);
  const front = facing ?? (axis === "x" ? "south" : "west");
  const d = DIRS[front];
  if (!d) throw new Error(`wardrobe: facing must be north, south, east or west, got ${front}`);
  if (axis === "x" ? d[0] !== 0 : d[2] !== 0) throw new Error(`wardrobe: facing ${front} must be across axis ${axis}`);
  const o = newOut();
  const [ax, az] = axis === "x" ? [1, 0] : [0, 1];
  for (let i = 0; i < len; i++) {
    const bx = x + ax * i, bz = z + az * i;
    for (const y of [2, 3]) {
      put(g, o, bx, y, bz, B.block("spruce_planks"));
      put(g, o, bx + d[0], y, bz + d[2], B.trapdoor("spruce", front, "bottom", true));
    }
  }
  return o;
}
