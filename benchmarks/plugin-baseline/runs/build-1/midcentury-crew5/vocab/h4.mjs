// Mid-century house, vocabulary helpers h4 (plan.md VOCABULARY). Every helper takes the grid first, then world
// coordinates (and facing where it has one), and writes only into AIR: a cell that already holds a block (an earlier
// part's ground, floor or wall) is skipped, never replaced. Each returns the number of blocks it placed.
import { B, DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one block into air; 1 if placed, 0 if the cell was already filled
const put = (g, x, y, z, ...args) => {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, ...args);
  return 1;
};

// seeded rng (mulberry32) so a ledge wall is the same on every run
const rngFrom = (seed) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

/** Glass in a line: glass_bay(g, x0, x1, z, y0, y1) along x at fixed z; { axis: "z" } reads x0..x1 as z at fixed x. */
export function glass_bay(g, a0, a1, fixed, y0, y1, { axis = "x" } = {}) {
  let n = 0;
  for (const a of span(a0, a1)) for (const y of span(y0, y1)) {
    const [x, z] = axis === "x" ? [a, fixed] : [fixed, a];
    n += put(g, x, y, z, ...B.pane());
  }
  return n;
}

/** Freestanding ledgestone leaf: mud_bricks with ~25% packed_mud (seeded), mud_brick_slab cap on the non-beam-line cells. */
export function ledgestone_wall(g, x0, x1, z = 7, y0 = 1, y1 = 4, seed = 25) {
  const rng = rngFrom(seed);
  let n = 0;
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) {
    const block = rng() < 0.25 ? "packed_mud" : "mud_bricks";   // rng advances per cell, so the pattern is fixed
    n += put(g, x, y, z, ...B.block(block));
  }
  for (const x of span(x0, x1)) if (x % 3 !== 1) n += put(g, x, y1 + 1, z, ...B.slab("mud_brick", "bottom")); // x % 3 === 1 is a beam line
  return n;
}

/** Carport at the west edge: origin (x0, z0) is the deck's north-west corner (plan: x0=0, z0=7). Deck 10 x 15. */
export function carport(g, x0 = 0, z0 = 7) {
  const x1 = x0 + 9, z1 = z0 + 14, postX = x0 + 1, rows = [z0 + 1, z0 + 7, z0 + 13];
  let n = 0;
  // fascia first, so the deck (air only) fills the rest of its own layer
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    if (x === x0 || z === z0 || z === z1) n += put(g, x, 5, z, ...B.slab("dark_oak", "bottom"));
  }
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) n += put(g, x, 5, z, ...B.slab("smooth_stone", "bottom"));
  for (const z of rows) {
    for (let y = 1; y <= 3; y++) n += put(g, postX, y, z, ...B.log("dark_oak", "y"));
    for (const x of span(x0, x1)) n += put(g, x, 4, z, ...B.log("dark_oak", "x"));
  }
  // floor under the carport: the ground part owns y=0, so this only lands where the cell is air
  for (const x of span(postX, x1)) for (const z of span(z0, z1)) n += put(g, x, 0, z, ...B.block("smooth_stone"));
  return n;
}

// the 50s car, nose to the street (north). Rows are z from z0 (nose) to z0+6; columns x from x0 to x0+2. null = air.
const CAR_BODY = [
  ["yellow_concrete", "iron_block", "yellow_concrete"],
  ["black_concrete", "cyan_concrete", "black_concrete"],
  ["cyan_concrete", "cyan_concrete", "cyan_concrete"],
  ["cyan_concrete", "cyan_concrete", "cyan_concrete"],
  ["cyan_concrete", "cyan_concrete", "cyan_concrete"],
  ["black_concrete", "cyan_concrete", "black_concrete"],
  ["red_concrete", "iron_block", "red_concrete"],
];
const CAR_CABIN = [
  null,
  null,
  ["glass_pane", "glass_pane", "glass_pane"],
  ["glass_pane", "white_concrete", "glass_pane"],
  ["glass_pane", "glass_pane", "glass_pane"],
  null,
  ["white_concrete", null, "white_concrete"],
];

/** The two-tone 50s car: car_50s(g, x0, z0), x0..x0+2 and z0..z0+6, y=1..2. Nose north only. */
export function car_50s(g, x0 = 3, z0 = 1) {
  let n = 0;
  const layer = (rows, y) => rows.forEach((row, r) => row?.forEach((block, c) => {
    if (block) n += put(g, x0 + c, y, z0 + r, ...B.block(block));
  }));
  layer(CAR_BODY, 1);
  layer(CAR_CABIN, 2);
  return n;
}

/** Low mailbox at the head of the drive: dark_oak_fence post at y=1, a smoker box at y=2 (facing east). */
export function mailbox(g, x = 9, z = 1) {
  return put(g, x, 1, z, ...B.fence("dark_oak")) + put(g, x, 2, z, "smoker", { facing: "east", lit: "false" });
}

/** Garden lamp: dark_oak_fence post at y=1..2, standing lantern at y=3. (x, z) on sand or lawn. */
export function garden_lamp(g, x, z) {
  let n = 0;
  for (const y of [1, 2]) n += put(g, x, y, z, ...B.fence("dark_oak"));
  return n + put(g, x, 3, z, ...B.lantern(false));
}

/**
 * Low sofa, orange upholstery, at y=2 (floor y=1). len cells along axis ("x" or "z") from (x, z); the two end
 * cells are arms (stairs with their high side outward), the rest seat stairs with their high side at the back.
 * facing = the way the sitter looks; the backrest (open iron trapdoors) is the row directly behind the seat.
 */
export function sofa_low(g, x, z, len, axis, facing) {
  if (axis !== "x" && axis !== "z") throw new Error(`sofa_low: axis must be "x" or "z", got ${axis}`);
  const along = axis === "x" ? "east" : "south";
  const rear = face.opposite(facing);
  const [ax, , az] = DIRS[along];
  const [rx, , rz] = DIRS[rear];
  let n = 0;
  for (let i = 0; i < len; i++) {
    const cx = x + ax * i, cz = z + az * i;
    const shape = i === 0 ? face.opposite(along) : i === len - 1 ? along : rear;
    n += put(g, cx, 2, cz, ...B.stairs("smooth_red_sandstone", shape, "bottom"));
    n += put(g, cx + rx, 2, cz + rz, ...B.trapdoor("iron", facing, "bottom", true));
  }
  return n;
}

/**
 * Sunken conversation pit: the rim (x0..x1, z0..z1) is at y=1 with smooth_quartz_stairs facing inward and
 * quartz_slab corners; the inside is the pit floor at y=0 (smooth_quartz, air only). Inside the rim, orange carpet
 * cushions round a low spruce coffee table at the centre. Needs at least 3 cells each way.
 */
export function conversation_pit(g, x0, z0, x1, z1) {
  if (x1 - x0 < 2 || z1 - z0 < 2) throw new Error("conversation_pit: needs at least 3 x 3 cells");
  let n = 0;
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) n += put(g, x, 0, z, ...B.block("smooth_quartz"));
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
    if (!onX && !onZ) continue;
    if (onX && onZ) n += put(g, x, 1, z, ...B.slab("smooth_quartz", "bottom"));
    else if (z === z0) n += put(g, x, 1, z, ...B.stairs("smooth_quartz", "south", "bottom"));
    else if (z === z1) n += put(g, x, 1, z, ...B.stairs("smooth_quartz", "north", "bottom"));
    else if (x === x0) n += put(g, x, 1, z, ...B.stairs("smooth_quartz", "east", "bottom"));
    else n += put(g, x, 1, z, ...B.stairs("smooth_quartz", "west", "bottom"));
  }
  const cx = (x0 + x1) >> 1, cz = (z0 + z1) >> 1;
  n += put(g, cx, 1, cz, ...B.fence("spruce"));
  n += put(g, cx, 2, cz, ...B.slab("spruce", "top"));
  for (const x of span(x0 + 1, x1 - 1)) for (const z of span(z0 + 1, z1 - 1)) n += put(g, x, 1, z, ...B.block("orange_carpet"));
  return n;
}

/**
 * Double bed, foot cell (x, z) at y=2, head one cell toward facing. A spruce_planks headboard stands behind the
 * head, and a birch_slab nightstand on a spruce_fence flanks the head on both sides. Footprint: 3 cells along
 * facing, 3 across, y=2..3. color: orange, cyan, yellow, light_blue or white.
 */
export function bed_double(g, x, z, facing, color = "orange") {
  const [dx, , dz] = DIRS[facing];
  const hx = x + dx, hz = z + dz;
  const sides = dx === 0 ? [DIRS.east, DIRS.west] : [DIRS.south, DIRS.north];
  let n = 0;
  n += put(g, x, 2, z, `${color}_bed`, { facing, part: "foot" });
  n += put(g, hx, 2, hz, `${color}_bed`, { facing, part: "head" });
  n += put(g, hx + dx, 2, hz + dz, ...B.block("spruce_planks"));
  for (const [sx, , sz] of sides) {
    n += put(g, hx + sx, 2, hz + sz, ...B.fence("spruce"));
    n += put(g, hx + sx, 3, hz + sz, ...B.slab("birch", "bottom"));
  }
  return n;
}
