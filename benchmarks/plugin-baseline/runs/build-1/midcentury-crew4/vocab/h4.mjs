// Mid-century house helpers, part h4 (plan.md VOCABULARY): glass_bay, ledgestone_wall, carport, car_50s, mailbox,
// garden_lamp, sofa_low, conversation_pit, bed_double. Each takes its grid, then its position (and facing) as
// arguments, then an optional opts object. A helper writes only the footprint its arguments define, and only into air:
// a cell already built is skipped and listed in `skipped` (opts.over: true overwrites instead). Nothing is written
// below y=0 (counted in `below`). Every helper returns { placed, skipped: [[x,y,z], ...], below }.
// Leaves are persistent=true; nothing here hangs a light (hung_lantern is h1's).
import { B, DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, skipped: [], below: 0 });
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

// one block [block, state?, nbt?] into an air cell; the tuple is the build library's [block, state] form
function put(g, out, x, y, z, [block, state, nbt], over = false) {
  if (y < 0) { out.below++; return; }
  if (!over && !g.isAir(x, y, z)) { out.skipped.push([x, y, z]); return; }
  g.set(x, y, z, block, state, nbt);
  out.placed++;
}

// the structure's beam lines (plan.md: x = 10, 13, ..., 31); a wall's stone cap skips them
const isBeamLine = (x) => x >= 10 && x <= 31 && (x - 10) % 3 === 0;

// a fixed hash of the cell in [0, 1): the same cell always gets the same flecks, whatever order the wall is built in
function noise(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---- exterior -----------------------------------------------------------------------------------------------------

/**
 * Glazing in a wall run: glass_pane over a0..a1 at height y0..y1, in the plane at `fixed`. Default axis "x": the run
 * is along x at z = fixed (the south glass wall, the window bays). { axis: "z" }: the run is along z at x = fixed (the
 * gable-end clerestories at x=10 and x=31). Glass has no states: it connects by itself.
 */
export function glass_bay(g, a0, a1, fixed, y0, y1, { axis = "x", over = false } = {}) {
  const out = result();
  for (const a of span(a0, a1)) for (const y of span(y0, y1)) {
    const [x, z] = axis === "z" ? [fixed, a] : [a, fixed];
    put(g, out, x, y, z, ["glass_pane"], over);
  }
  return out;
}

/**
 * The freestanding feature wall along x0..x1 at z (plan.md: 1 proud of the north wall), y0..y1 high. Each cell is
 * mud_bricks, or packed_mud with probability 0.25 (a fixed per-cell hash). Its top is capped with mud_brick_slab
 * (type bottom) at y1+1, on every cell except the beam lines, where the roof's beams pass over.
 */
export function ledgestone_wall(g, x0, x1, z = 7, y0 = 1, y1 = 4, opts = {}) {
  const out = result(), over = !!opts.over;
  for (const x of span(x0, x1)) for (const y of span(y0, y1)) {
    put(g, out, x, y, z, [noise(x, y, z) < 0.25 ? "packed_mud" : "mud_bricks"], over);
  }
  for (const x of span(x0, x1)) if (!isBeamLine(x)) put(g, out, x, y1 + 1, z, B.slab("mud_brick", "bottom"), over);
  return out;
}

/**
 * The flat carport: a 10 x 15 deck (x0..x0+9, z0..z0+14) at y=5 on dark_oak_log posts (x0+1, y=1..3, at z0+1, z0+7,
 * z0+13) with dark_oak_log beams along x at y=4. The deck is smooth_stone_slab (bottom); the outer edge (x0, z0 and
 * z0+14) is dark_oak_slab fascia (bottom). The floor under it (y=0, smooth_stone) belongs to the site part: it is
 * laid only with { floor: true }, which overwrites the ground there.
 */
export function carport(g, x0 = 0, z0 = 7, opts = {}) {
  const out = result(), over = !!opts.over;
  const x1 = x0 + 9, z1 = z0 + 14;
  for (const z of [z0 + 1, z0 + 7, z0 + 13]) {
    for (const y of [1, 2, 3]) put(g, out, x0 + 1, y, z, B.log("dark_oak", "y"), over);
    for (let x = x0; x <= x1; x++) put(g, out, x, 4, z, B.log("dark_oak", "x"), over);
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const fascia = x === x0 || z === z0 || z === z1;
    put(g, out, x, 5, z, fascia ? B.slab("dark_oak", "bottom") : B.slab("smooth_stone", "bottom"), over);
  }
  if (opts.floor) for (let x = x0 + 1; x <= x1; x++) for (let z = z0; z <= z1; z++) put(g, out, x, 0, z, ["smooth_stone"], true);
  return out;
}

// ---- cars and street furniture ------------------------------------------------------------------------------------

// the 1950s two-tone car, rows from the nose (dz 0, the street) to the tail (dz 6); each row is dx 0..2 (null = leave)
const CAR = [
  [1, 0, ["yellow_concrete", "iron_block", "yellow_concrete"]],
  [1, 1, ["black_concrete", "cyan_concrete", "black_concrete"]],
  [1, 2, ["cyan_concrete", "cyan_concrete", "cyan_concrete"]],
  [1, 3, ["cyan_concrete", "cyan_concrete", "cyan_concrete"]],
  [1, 4, ["cyan_concrete", "cyan_concrete", "cyan_concrete"]],
  [1, 5, ["black_concrete", "cyan_concrete", "black_concrete"]],
  [1, 6, ["red_concrete", "iron_block", "red_concrete"]],
  [2, 2, ["glass_pane", "glass_pane", "glass_pane"]],
  [2, 3, ["glass_pane", "white_concrete", "glass_pane"]],
  [2, 4, ["glass_pane", "glass_pane", "glass_pane"]],
  [2, 6, ["white_concrete", null, "white_concrete"]],
];

/** The two-tone 1950s car, nose to the street: x..x+2 by z..z+6, y=1..2 (the driveway is y=0). */
export function car_50s(g, x = 3, z = 1, opts = {}) {
  const out = result(), over = !!opts.over;
  for (const [y, dz, row] of CAR) row.forEach((block, dx) => { if (block) put(g, out, x + dx, y, z + dz, [block], over); });
  return out;
}

/** The low mailbox at the head of the drive: dark_oak_fence post at (x,1,z), a smoker box at (x,2,z) facing east. */
export function mailbox(g, x = 9, z = 1, opts = {}) {
  const out = result(), over = !!opts.over;
  put(g, out, x, 1, z, B.fence("dark_oak"), over);
  put(g, out, x, 2, z, ["smoker", { facing: "east", lit: "false" }], over);
  return out;
}

/** A garden lamp on a sand or lawn cell: dark_oak_fence post at y=1..2, a standing lantern at y=3. */
export function garden_lamp(g, x, z, opts = {}) {
  const out = result(), over = !!opts.over;
  put(g, out, x, 1, z, B.fence("dark_oak"), over);
  put(g, out, x, 2, z, B.fence("dark_oak"), over);
  put(g, out, x, 3, z, B.lantern(false), over);
  return out;
}

// ---- interior -----------------------------------------------------------------------------------------------------

/**
 * A low sofa at y=2 (the floor is y=1): a seat row of len smooth_red_sandstone_stairs starting at x,z and running along
 * `axis` ("x" or "z"); `facing` is the way the sitter looks. The seat stairs have their high back on the rear side,
 * a row of open iron_trapdoors stands one cell behind the seat as the backrest, and an arm stair sits at each end of
 * the seat row, turned to face the seat.
 */
export function sofa_low(g, x, z, len, axis, facing, opts = {}) {
  const out = result(), over = !!opts.over;
  const along = axis === "x" ? "east" : "south";           // the seat row runs this way
  const rear = face.opposite(facing);                       // behind the sitter
  const [ax, , az] = DIRS[along], [rx, , rz] = DIRS[rear];
  for (let i = 0; i < len; i++) {
    const sx = x + i * ax, sz = z + i * az;
    put(g, out, sx, 2, sz, B.stairs("smooth_red_sandstone", rear), over);
    put(g, out, sx + rx, 2, sz + rz, B.trapdoor("iron", facing, "bottom", true), over);
  }
  put(g, out, x - ax, 2, z - az, B.stairs("smooth_red_sandstone", along), over);
  put(g, out, x + len * ax, 2, z + len * az, B.stairs("smooth_red_sandstone", face.opposite(along)), over);
  return out;
}

/**
 * A sunken conversation pit over the box x0..x1, z0..z1 (inclusive; the pit air is y=1, the floor y=0 is the shell's).
 * The rim is a ring at y=1 of smooth_quartz_stairs facing inward, corners smooth_quartz_slab (bottom); an orange_carpet
 * seat cushion sits on each stair at y=2. A low spruce_slab table stands in the middle at y=1. { floor: true } lays
 * the smooth_quartz pit floor at y=0, overwriting the ground.
 */
export function conversation_pit(g, x0, z0, x1, z1, opts = {}) {
  const out = result(), over = !!opts.over;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (opts.floor) put(g, out, x, 0, z, ["smooth_quartz"], true);
    const onX = x === x0 || x === x1, onZ = z === z0 || z === z1;
    if (!onX && !onZ) continue;                                   // the inside is open pit
    if (onX && onZ) { put(g, out, x, 1, z, B.slab("smooth_quartz", "bottom"), over); continue; }
    const inward = onZ ? (z === z0 ? "south" : "north") : (x === x0 ? "east" : "west");
    put(g, out, x, 1, z, B.stairs("smooth_quartz", inward, "bottom"), over);
    put(g, out, x, 2, z, ["orange_carpet"], over);
  }
  put(g, out, Math.floor((x0 + x1) / 2), 1, Math.floor((z0 + z1) / 2), B.slab("spruce", "bottom"), over);
  return out;
}

/**
 * A double bed: foot cell at (x,2,z), head cell one step along `facing` (the game's bed rule: the head is at the foot
 * plus facing). A spruce_planks headboard one high stands behind the head, and a nightstand (spruce_fence with a
 * birch_slab top at y=3) stands on each side of the head. `color` is the bed's dye: white, orange, cyan, yellow, light_blue.
 * Footprint: 3 cells along facing (foot, head, headboard) and 3 across at the head end; the foot side stays free.
 */
export function bed_double(g, x, z, facing, color = "white", opts = {}) {
  const out = result(), over = !!opts.over;
  const [dx, , dz] = DIRS[facing], [px, , pz] = [dz, 0, dx];   // px,pz: across the bed
  const hx = x + dx, hz = z + dz;
  put(g, out, x, 2, z, [`${color}_bed`, { facing, part: "foot" }], over);
  put(g, out, hx, 2, hz, [`${color}_bed`, { facing, part: "head" }], over);
  put(g, out, hx + dx, 2, hz + dz, ["spruce_planks"], over);
  for (const s of [-1, 1]) {
    put(g, out, hx + s * px, 2, hz + s * pz, B.fence("spruce"), over);
    put(g, out, hx + s * px, 3, hz + s * pz, B.slab("birch", "bottom"), over);
  }
  return out;
}
