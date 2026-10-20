// Vocabulary helpers from plan.md VOCABULARY: hang_lamp, flower_bucket, pier_bay, shop_door, terrace_edge,
// craft_table, neon_sign, ice_bed. Each takes the grid first, then its position (and face, where it has one) as
// arguments, and writes only its own footprint. Writes go into air only: a built cell is refused and listed, never
// overwritten. Pieces that read as one object (lamp, table, door, sign, bed) are all-or-nothing; walls and decks run
// cell by cell. Returns { placed, refused: [[x, y, z, block]] }. Leaves are persistent=true, as on 1.21.1.
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = { east: 1, west: -1 };          // the outward step of a wall facing each way
const IN = { east: "west", west: "east" };  // the stair facing that points back into that wall
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // a pane run along z
const POST = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };   // a lone fence or bar post

// One write path for every helper. cells: [x, y, z, block, state] (the last entry for a cell wins).
function write(g, cells, { atomic = false } = {}) {
  const last = new Map(cells.map((c) => [`${c[0]},${c[1]},${c[2]}`, c]));
  const list = [...last.values()], free = list.map(([x, y, z]) => g.inBounds(x, y, z) && g.isAir(x, y, z));
  const out = { placed: 0, refused: [] };
  if (atomic && !free.every(Boolean)) return { placed: 0, refused: list.map(([x, y, z, b]) => [x, y, z, b]) };
  list.forEach(([x, y, z, block, state], i) => {
    if (!free[i]) return out.refused.push([x, y, z, block]);
    g.set(x, y, z, block, state);
    out.placed++;
  });
  return out;
}

/** Hanging lantern: chain at y+1 from the built block at y+2 (the beam), lantern hanging at y. Refused if y+2 is air. */
export function hang_lamp(g, { x, y, z }) {
  if (g.isAir(x, y + 2, z)) return { placed: 0, refused: [[x, y, z, "lantern"], [x, y + 1, z, "chain"]] };
  return write(g, [
    [x, y + 1, z, "chain", { axis: "y", waterlogged: "false" }],
    [x, y, z, "lantern", { hanging: "true", waterlogged: "false" }],
  ], { atomic: true });
}

/** Cauldron at (x, y, z) with a persistent azalea bunch on top at y+1. Stands against a post base. */
export function flower_bucket(g, { x, y, z }) {
  return write(g, [
    [x, y, z, "cauldron"],
    [x, y + 1, z, "flowering_azalea_leaves", { persistent: "true" }],
  ], { atomic: true });
}

/** The 2-wide pier between windows on a wall at x = `x` (face east or west), cells z0..z0+1, y0..y1, in quartz_bricks.
 *  pilaster: a smooth_quartz pilaster 1 proud on its first column (z0), capped by an upper stair; the caller picks
 *  every third pier. */
export function pier_bay(g, { face, x, z0, y0, y1, pilaster = false }) {
  const o = OUT[face], cells = [];
  for (let z = z0; z <= z0 + 1; z++) for (let y = y0; y <= y1; y++) cells.push([x, y, z, "quartz_bricks"]);
  if (pilaster) {
    for (let y = y0; y < y1; y++) cells.push([x + o, y, z0, "smooth_quartz"]);
    cells.push([x + o, y1, z0, "smooth_quartz_stairs", { facing: IN[face], half: "top", shape: "straight", waterlogged: "false" }]);
  }
  return write(g, cells);
}

/** Shop door pair in a wall at x (face east or west): two dark_oak_door leaves at z and z+1 (hinges left and right,
 *  lower and upper halves), glass sidelights at z-1 and z+2, a glass transom at y+2, and a smooth_quartz_stairs lintel
 *  at y+3 projecting one out from the wall. Needs the opening (y..y+2, z-1..z+2) to be air; all-or-nothing. */
export function shop_door(g, { x, y, z, face = "east" }) {
  const cells = [];
  for (const [zz, hinge] of [[z, "left"], [z + 1, "right"]]) {
    const leaf = { facing: face, hinge, open: "false", powered: "false" };
    cells.push([x, y, zz, "dark_oak_door", { ...leaf, half: "lower" }], [x, y + 1, zz, "dark_oak_door", { ...leaf, half: "upper" }]);
  }
  for (const zz of [z - 1, z + 2]) for (const yy of [y, y + 1]) cells.push([x, yy, zz, "glass_pane", PANE_Z]);
  for (let zz = z - 1; zz <= z + 2; zz++) {
    cells.push([x, y + 2, zz, "glass_pane", PANE_Z]);
    cells.push([x + OUT[face], y + 3, zz, "smooth_quartz_stairs", { facing: IN[face], half: "top", shape: "straight", waterlogged: "false" }]);
  }
  return write(g, cells, { atomic: true });
}

/** Terrace deck (smooth_stone) over x0..x1, z0..z1 at y, with a stone_brick_wall parapet on its `edge`
 *  (west | east | north | south) at y+1. planters: barrels at y+1 with azalea bunches at y+2, one step in from the
 *  edge every 4 cells along it. */
export function terrace_edge(g, { x0, x1, z0, z1, y, edge, planters = true }) {
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.push([x, y, z, "smooth_stone"]);
  const ew = edge === "west" || edge === "east";
  const arms = ew ? { north: "low", south: "low", east: "none", west: "none" } : { east: "low", west: "low", north: "none", south: "none" };
  if (ew) for (let z = z0; z <= z1; z++) cells.push([edge === "west" ? x0 : x1, y + 1, z, "stone_brick_wall", { up: "true", ...arms }]);
  else for (let x = x0; x <= x1; x++) cells.push([x, y + 1, edge === "north" ? z0 : z1, "stone_brick_wall", { up: "true", ...arms }]);
  if (planters) {
    const [lo, hi] = ew ? [z0 + 1, z1 - 1] : [x0 + 1, x1 - 1];
    for (let p = lo; p <= hi; p += 4) {
      const [bx, bz] = ew ? [edge === "west" ? x0 + 1 : x1 - 1, p] : [p, edge === "north" ? z0 + 1 : z1 - 1];
      cells.push([bx, y + 1, bz, "barrel", { facing: "up", open: "false" }], [bx, y + 2, bz, "flowering_azalea_leaves", { persistent: "true" }]);
    }
  }
  return write(g, cells);
}

/** Two-deep craft table, 3 wide: dark_oak_fence legs at the corners from y, a top dark_oak_slab (type top) at y+1 over
 *  x0..x0+2, z..z+1, and wares on the top face at y+2 (pots, a decorated pot, a lit candle). Footprint x0..x0+2,
 *  y..y+2, z..z+1; the z+2 row stays clear as the lane between pairs. */
export function craft_table(g, { x0, z, y }) {
  const cells = [];
  for (const x of [x0, x0 + 2]) for (const zz of [z, z + 1]) cells.push([x, y, zz, "dark_oak_fence", POST]);
  for (let x = x0; x <= x0 + 2; x++) for (let zz = z; zz <= z + 1; zz++) cells.push([x, y + 1, zz, "dark_oak_slab", { type: "top", waterlogged: "false" }]);
  cells.push([x0, y + 2, z, "potted_red_tulip"], [x0 + 2, y + 2, z, "decorated_pot"], [x0, y + 2, z + 1, "candle", { candles: "1", lit: "true" }], [x0 + 2, y + 2, z + 1, "potted_poppy"]);
  return write(g, cells, { atomic: true });
}

/** PUBLIC MARKET CENTER neon sign on a roof deck, facing east. Back skin at x, board x..x+2 over y+5..y+26 and z0..z1,
 *  letters on the face x+2 (plaque, red_stained_glass, read left to right toward -z), glowstone behind each letter at
 *  x+1, a red neon border one cell in from the board edge with lit redstone_lamps behind it. Legs are iron_bars at x+1
 *  every 8 cells along z from z0+2, y..y+3; rails of white_concrete at y+4 and y+27; finials on the legs at y+28.
 *  The frame and board are all-or-nothing; the letters go on the board they were drawn on. */
export function neon_sign(g, { x, y, z0, z1 }) {
  const cells = [];
  for (let zl = z0 + 2; zl <= z1 - 2; zl += 8) {
    for (let yy = y; yy <= y + 3; yy++) cells.push([x + 1, yy, zl, "iron_bars", POST]);
    cells.push([x + 1, y + 28, zl, "iron_bars", POST]);
  }
  for (let xx = x; xx <= x + 2; xx++) for (let zz = z0; zz <= z1; zz++) {
    cells.push([xx, y + 4, zz, "white_concrete"], [xx, y + 27, zz, "white_concrete"]);
    for (let yy = y + 5; yy <= y + 26; yy++) cells.push([xx, yy, zz, "white_concrete"]);
  }
  const frame = write(g, cells, { atomic: true });
  if (frame.refused.length) return frame;

  for (const [text, yy] of [["CENTER", y + 5], ["MARKET", y + 12], ["PUBLIC", y + 19]]) {
    plaque(g, text, { at: [x + 2, yy, z1], face: "east", width: z1 - z0 + 1, height: 5, letter: "red_stained_glass", material: null, frame: null });
  }
  const isLetter = (zz, yy) => g.blockAt(x + 2, yy, zz) === "minecraft:red_stained_glass";
  for (let yy = y + 5; yy <= y + 26; yy++) for (let zz = z0; zz <= z1; zz++) if (isLetter(zz, yy)) g.set(x + 1, yy, zz, "glowstone");
  const onBorder = (zz, yy) =>
    ((yy === y + 6 || yy === y + 25) && zz >= z0 + 1 && zz <= z1 - 1) || ((zz === z0 + 1 || zz === z1 - 1) && yy >= y + 6 && yy <= y + 25);
  for (let yy = y + 6; yy <= y + 25; yy++) for (let zz = z0 + 1; zz <= z1 - 1; zz++) {
    if (!onBorder(zz, yy) || isLetter(zz, yy)) continue;
    g.set(x + 2, yy, zz, "red_stained_glass");
    g.set(x + 1, yy, zz, "redstone_lamp", { lit: "true" });
  }
  return { placed: frame.placed, refused: [] };
}

/** Fish-market ice bed: dark_oak_planks trough at y over x0..x1, z0..z1, packed_ice at y+1, and fish / kelp / lobster
 *  pieces on the ice at y+2 in a diagonal pattern (wool fish, dried_kelp_block, red_concrete lobster). A standing lantern
 *  on each corner. All-or-nothing. */
export function ice_bed(g, { x0, x1, z0, z1, y }) {
  const FISH = ["orange_wool", "red_wool", "pink_wool", "light_gray_wool"];
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    cells.push([x, y, z, "dark_oak_planks"], [x, y + 1, z, "packed_ice"]);
    const k = (x - x0 + 2 * (z - z0)) % 7;
    if (k <= 1) cells.push([x, y + 2, z, FISH[((x - x0) + (z - z0)) % FISH.length]]);
    else if (k === 3) cells.push([x, y + 2, z, "dried_kelp_block"]);
    else if (k === 5) cells.push([x, y + 2, z, "red_concrete"]);
  }
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) cells.push([x, y + 2, z, "lantern", { hanging: "false", waterlogged: "false" }]);
  return write(g, cells, { atomic: true });
}
