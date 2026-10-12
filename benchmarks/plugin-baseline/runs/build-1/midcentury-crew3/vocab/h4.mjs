// Vocabulary part h4 (plan.md VOCABULARY): glazing, ledgestone, carport, car, mailbox, garden lamp, and the
// furniture for the living room, the pit and the bedrooms. Every helper takes its position (and facing) as arguments.
// Each writes only into air and returns { placed, skipped } (skipped = a cell that was not air, or outside the grid);
// none touches y <= 0, where the ground, sand and floors belong to earlier parts.
import { DIRS, OPPOSITE, face, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BEAM_X0 = 10, BEAM_STEP = 3; // beam lines x = 10, 13, ..., 31 (plan.md, structural rhythm)
const BED_COLOURS = ["orange", "cyan", "yellow", "light_blue", "white"];

// one call's writer: places a block only into air inside the grid, and counts what it could not place
function writer(g) {
  const out = { placed: 0, skipped: 0 };
  const put = (x, y, z, block, state, nbt) => {
    if (g.inBounds(x, y, z) && g.isAir(x, y, z)) { g.set(x, y, z, block, state, nbt); out.placed++; } else out.skipped++;
  };
  return { put, out };
}

// inclusive run from a to b, in either order
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

// seeded PRNG (mulberry32) so the same seed always gives the same wall
function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Glass panes in a run along x: x0..x1 at row z, y0..y1 (the south garden wall, the atrium ring). */
export function glass_bay(g, x0, x1, z, y0, y1) {
  const { put, out } = writer(g);
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) put(x, y, z, "glass_pane");
  return out;
}

/** Glass panes in a run along z: z0..z1 at column x, y0..y1 (the gable-end clerestories). */
export function glass_bay_z(g, x, z0, z1, y0, y1) {
  const { put, out } = writer(g);
  for (const z of span(z0, z1)) for (const y of span(y0, y1)) put(x, y, z, "glass_pane");
  return out;
}

/**
 * Freestanding tan ledgestone leaf at row z, x0..x1, y0..y1: mud_bricks with ~25% packed_mud (seeded), and a
 * mud_brick_slab cap on y1+1 only between the beam lines (the cells a beam does not cross).
 */
export function ledgestone_wall(g, x0, x1, z, y0 = 1, y1 = 4, seed = 1) {
  const { put, out } = writer(g);
  const rng = mulberry32(seed);
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) put(x, y, z, rng() < 0.25 ? "packed_mud" : "mud_bricks");
  for (const x of span(x0, x1)) if ((x - BEAM_X0) % BEAM_STEP !== 0) put(x, y1 + 1, z, ...B.slab("mud_brick", "bottom"));
  return out;
}

/**
 * Open carport over the box x0..x1, z0..z1 (street edge z0): a smooth_stone_slab deck at y=5 with dark_oak_slab fascia
 * on the outer edges x0, z0 and z1; dark_oak_log posts at x0+1 (y=1..3) and beams along x (y=4) at z0+1, z0+7, ...
 * (every 6 cells). No floor is laid: the ground below belongs to the site part.
 */
export function carport(g, x0, z0, x1, z1) {
  const { put, out } = writer(g);
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const fascia = x === x0 || z === z0 || z === z1;
    put(x, 5, z, ...B.slab(fascia ? "dark_oak" : "smooth_stone", "bottom"));
  }
  for (let z = z0 + 1; z < z1; z += 6) {
    for (const y of span(1, 3)) put(x0 + 1, y, z, ...B.log("dark_oak", "y"));
    for (const x of span(x0, x1)) put(x, 4, z, ...B.log("dark_oak", "x"));
  }
  return out;
}

// the 1950s car, nose-first: rows are v (0 = nose, 6 = tail), columns are u across the car (0..2)
const CAR_BODY = [
  ["yellow_concrete", "iron_block", "yellow_concrete"],   // v0: nose, headlamps and grille
  ["black_concrete", "cyan_concrete", "black_concrete"],  // v1: front wheels
  ["cyan_concrete", "cyan_concrete", "cyan_concrete"],    // v2
  ["cyan_concrete", "cyan_concrete", "cyan_concrete"],    // v3
  ["cyan_concrete", "cyan_concrete", "cyan_concrete"],    // v4
  ["black_concrete", "cyan_concrete", "black_concrete"],  // v5: rear wheels
  ["red_concrete", "iron_block", "red_concrete"],         // v6: tail lamps and bumper
];
const CAR_CABIN = {
  2: ["glass_pane", "glass_pane", "glass_pane"],          // windscreen
  3: ["glass_pane", "white_concrete", "glass_pane"],      // roof strip
  4: ["glass_pane", "glass_pane", "glass_pane"],          // rear window
  6: ["white_concrete", null, "white_concrete"],          // tail fins
};

/**
 * Two-tone 50s car on the driveway: its nose-end min corner at (x, z), standing on y=0 with the body at y=1 and the cabin
 * at y=2. facing = the nose's direction (north is the street, z smaller). Footprint: 3 x 7 for north/south, 7 x 3 for east/west.
 */
export function car_50s(g, x, z, facing = "north") {
  const { put, out } = writer(g);
  // local (u across, v from the nose) -> world x, z
  const at = {
    north: (u, v) => [x + u, z + v],
    south: (u, v) => [x + 2 - u, z + 6 - v],
    west: (u, v) => [x + v, z + u],
    east: (u, v) => [x + 6 - v, z + 2 - u],
  }[facing];
  if (!at) throw new Error(`car_50s: facing must be north, south, east or west (got ${facing})`);
  CAR_BODY.forEach((row, v) => row.forEach((block, u) => { const [wx, wz] = at(u, v); put(wx, 1, wz, block); }));
  for (const [v, row] of Object.entries(CAR_CABIN)) row.forEach((block, u) => { if (block) { const [wx, wz] = at(u, +v); put(wx, 2, wz, block); } });
  return out;
}

/** Low mailbox at the head of the driveway: dark_oak_fence post at y=1, a smoker as the box at y=2. */
export function mailbox(g, x, z, facing = "east") {
  const { put, out } = writer(g);
  put(x, 1, z, ...B.fence("dark_oak"));
  put(x, 2, z, "smoker", { facing });
  return out;
}

/** Garden lamp: dark_oak_fence post at y=1..2, a standing lantern at y=3 (on sand or lawn at y=0). */
export function garden_lamp(g, x, z) {
  const { put, out } = writer(g);
  put(x, 1, z, ...B.fence("dark_oak"));
  put(x, 2, z, ...B.fence("dark_oak"));
  put(x, 3, z, ...B.lantern(false));
  return out;
}

/**
 * Low sofa on the floor (y=2): a seat row of len smooth_red_sandstone_stairs along axis ("x" or "z"), facing the
 * direction `facing` (perpendicular to axis); an open iron_trapdoor backrest on the row behind it; a stair arm at each
 * end, its high back at the outer end. Footprint: len + 2 along the axis, 2 deep.
 */
export function sofa_low(g, x, z, len, axis, facing) {
  const { put, out } = writer(g);
  const across = axis === "x" ? ["north", "south"] : ["east", "west"];
  if (axis !== "x" && axis !== "z") throw new Error(`sofa_low: axis must be x or z (got ${axis})`);
  if (!across.includes(facing)) throw new Error(`sofa_low: facing must be ${across.join(" or ")} for axis ${axis} (got ${facing})`);
  const [ax, az] = axis === "x" ? [1, 0] : [0, 1];
  const back = DIRS[OPPOSITE[facing]];
  const [lowArm, highArm] = axis === "x" ? ["west", "east"] : ["north", "south"];
  for (let i = 0; i < len; i++) {
    const sx = x + ax * i, sz = z + az * i;
    put(sx, 2, sz, ...B.stairs("smooth_red_sandstone", facing));
    put(sx + back[0], 2, sz + back[2], ...B.trapdoor("iron", facing, "bottom", true));
  }
  put(x - ax, 2, z - az, ...B.stairs("smooth_red_sandstone", lowArm));
  put(x + ax * len, 2, z + az * len, ...B.stairs("smooth_red_sandstone", highArm));
  return out;
}

/**
 * Sunken conversation pit over the box x0..x1, z0..z1 (the floor at y=0 is the shell's smooth_quartz; nothing is written
 * there). At y=1: a ring of smooth_quartz_stairs facing inward on the four edges, quartz_slab corners, orange_carpet
 * on the sunk floor, and a spruce_slab coffee table on the middle cell. (The flower pot is left out: it would float.)
 */
export function conversation_pit(g, x0, z0, x1, z1) {
  const { put, out } = writer(g);
  const cx = Math.floor((x0 + x1) / 2), cz = Math.floor((z0 + z1) / 2);
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
    if (onX && onZ) put(x, 1, z, ...B.slab("quartz", "bottom"));
    else if (onZ) put(x, 1, z, ...B.stairs("smooth_quartz", z === z0 ? "south" : "north"));
    else if (onX) put(x, 1, z, ...B.stairs("smooth_quartz", x === x0 ? "east" : "west"));
    else if (x === cx && z === cz) put(x, 1, z, ...B.slab("spruce", "bottom"));
    else put(x, 1, z, "orange_carpet");
  }
  return out;
}

/**
 * Double bed with its foot at (x, z) and its head one cell toward `facing` (the way the bed points). Headboard of
 * spruce_planks behind the head, a spruce_fence + birch_slab nightstand on each side of the head. Footprint: 3 x 3,
 * y=2..3. The cell past the foot (foot - facing, y=2..3) is left clear as the lane.
 */
export function bed_double(g, x, z, facing, color = "orange") {
  if (!BED_COLOURS.includes(color)) throw new Error(`bed_double: colour must be one of ${BED_COLOURS.join(", ")} (got ${color})`);
  const { put, out } = writer(g);
  const d = DIRS[facing];
  if (!d) throw new Error(`bed_double: facing must be north, south, east or west (got ${facing})`);
  const hx = x + d[0], hz = z + d[2];
  put(x, 2, z, `${color}_bed`, { facing, part: "foot" });
  put(hx, 2, hz, `${color}_bed`, { facing, part: "head" });
  put(hx + d[0], 2, hz + d[2], "spruce_planks");
  for (const side of [face.cw(facing), face.ccw(facing)]) {
    const [px, pz] = DIRS[side];
    put(hx + px, 2, hz + pz, ...B.fence("spruce"));
    put(hx + px, 3, hz + pz, ...B.slab("birch", "bottom"));
  }
  return out;
}
