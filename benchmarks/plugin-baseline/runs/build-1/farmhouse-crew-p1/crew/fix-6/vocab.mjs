// Shared vocabulary for the farmhouse + potager. Every part imports from here: the layout constants, the palette
// as named constants, the OPENINGS table (single source for every door/window/gate), and one helper per repeated
// element. Helpers take the grid (or runParts view) first and place real blocks with correct states.
// Coordinates: x east (street runs along x), y up (ground block y=0, walking surface y=1), z south. FRONT = NORTH (-z).
import { Grid, B, roof, tree, face, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
export { Grid, B, roof, tree, face, runParts };

export const SIZE = [40, 18, 36];

// ---- layout (single source; parts and plan.md agree with these) -------------------------------------------------
export const HOUSE = { x0: 1, x1: 15, z0: 11, z1: 19, floor1: 1, floor2: 5, eave: 7, ridgeZ: 15 };   // walls y1..y7, roof y8..12 by `mcd roof`
export const PORCH = { x0: 16, x1: 18, z0: 12, z1: 18 };                                              // timber lean-to on the garden (east) side
export const GARDEN = { x0: 20, x1: 38, z0: 4, z1: 32, cx: 29, cz: 15 };                              // walls on these lines; interior x21..37, z5..31
export const BEDS = {                                                                                  // raised beds: rim ring + 4 crop rows
  NW: { x0: 22, x1: 27, z0: 6, z1: 13 }, NE: { x0: 31, x1: 36, z0: 6, z1: 13 },
  SW: { x0: 22, x1: 27, z0: 17, z1: 24 }, SE: { x0: 31, x1: 36, z0: 17, z1: 24 },
};
export const GREENHOUSE = { x0: 22, x1: 27, z0: 27, z1: 31 };
export const SHED = { x0: 32, x1: 36, z0: 28, z1: 31 };
export const COLDFRAME = { x0: 32, x1: 36, z0: 26, z1: 27 };
export const WELL = { cx: 29, cz: 15 };

// ---- palette constants (all ids are in palette.json) --------------------------------------------------------------
export const WALL_MIX = [["cobblestone", 40], ["stone", 25], ["andesite", 20], ["mossy_cobblestone", 15]];   // rough farmhouse stone
export const TRIM = "stone_bricks";          // quoins, lintels, jambs, pillars
export const PLINTH = "cobblestone";
export const BRICK = "bricks";               // chimney, path inlay
export const BEAM = "dark_oak_log";          // porch posts and beams
export const BOARD = "spruce_planks";        // floors, shed, bed rims
export const FLOOR_UP = "oak_planks";
export const SHUTTER = "warped";             // shutter trapdoor material (French blue-green)
export const ROOF_MATERIAL = "red-tile";     // used by make.sh (mcd roof), listed here for the small library roofs
export const LEAF = "oak_leaves", BLOSSOM = "flowering_azalea_leaves";

// ---- small utilities ----------------------------------------------------------------------------------------------
export const OUT = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };
export const opposite = face.opposite;
const ALONG = { north: [1, 0, 0], south: [1, 0, 0], east: [0, 0, 1], west: [0, 0, 1] };   // direction a wall runs, given the way it faces
export function hash(x, y, z, s = 0) { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function wallBlock(x, y, z) {
  const t = WALL_MIX.reduce((a, [, w]) => a + w, 0); let r = hash(x, y, z, 7) * t;
  for (const [b, w] of WALL_MIX) { if ((r -= w) < 0) return b; }
  return WALL_MIX[0][0];
}
/** Place a [block, state, nbt] pair from B.* (or a plain block name). */
export function put(g, x, y, z, pair, state) {
  if (typeof pair === "string") g.set(x, y, z, pair, state); else g.set(x, y, z, pair[0], pair[1], pair[2]);
}
/** Fill a box with rough wall stone (random per cell, deterministic). */
export function stoneFill(g, a, b) {
  for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
    for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) g.set(x, y, z, wallBlock(x, y, z));
}

// ---- OPENINGS: the one table of every door / window / doorway / gate -------------------------------------------------
// (x,y,z) = bottom cell of the opening in the wall plane; face = the way it looks out; h = height in cells.
// The part that builds a wall calls isOpening() and leaves those cells UNSET; later parts fill them with window()/door().
const W = (x, y, z, face, h = 2, extra = {}) => ({ kind: "window", x, y, z, face, h, ...extra });
const D = (x, y, z, face, extra = {}) => ({ kind: "door", x, y, z, face, h: 2, ...extra });
export const OPENINGS = [
  // house front (z=11, north): ground windows y3-4, door at x=8, upper windows y7 (1 high, under the eave)
  W(4, 3, 11, "north"), D(8, 2, 11, "north", { mat: "oak" }), W(12, 3, 11, "north"),
  W(4, 7, 11, "north", 1), W(8, 7, 11, "north", 1), W(12, 7, 11, "north", 1),
  // house back (z=19, south)
  W(4, 3, 19, "south"), W(8, 3, 19, "south"), W(12, 3, 19, "south"),
  W(4, 7, 19, "south", 1), W(8, 7, 19, "south", 1), W(12, 7, 19, "south", 1),
  // west gable (x=1) and east garden wall (x=15, under the porch)
  W(1, 3, 15, "west"), W(1, 7, 15, "west", 1),
  D(15, 2, 15, "east", { mat: "oak" }), W(15, 3, 13, "east"), W(15, 3, 17, "east"),
  // interior doorways in the partition x=9 (no door block, just the gap), ground and upper
  { kind: "doorway", x: 9, y: 2, z: 13, face: "east", h: 2 }, { kind: "doorway", x: 9, y: 6, z: 13, face: "east", h: 2 },
  // garden gate in the west wall (fence gate at y=1), greenhouse door, shed door
  { kind: "gate", x: 20, y: 1, z: 15, face: "west", h: 4 },
  D(25, 1, 27, "north", { mat: "oak" }),
  D(32, 1, 29, "west", { mat: "spruce" }),
];
const openCells = new Set();
for (const o of OPENINGS) for (let k = 0; k < o.h; k++) openCells.add(`${o.x},${o.y + k},${o.z}`);
/** True if (x,y,z) is a cell a wall must leave empty. */
export const isOpening = (x, y, z) => openCells.has(`${x},${y},${z}`);

/** Trim cells (stone-brick jambs and lintel) around a window/door: [[x,y,z,block,state?]...], placed by the part that owns the wall. */
export function frameCells(o) {
  const a = ALONG[o.face], out = [];
  if (o.kind === "doorway" || o.kind === "gate") return out;
  for (let k = 0; k < o.h; k++) for (const s of [-1, 1]) out.push([o.x + a[0] * s, o.y + k, o.z + a[2] * s, TRIM]);
  for (const s of [-1, 0, 1]) out.push([o.x + a[0] * s, o.y + o.h, o.z + a[2] * s, TRIM]);
  return out;
}

// ---- windows, doors, gate ------------------------------------------------------------------------------------------
/** Glass panes in the opening (connected along the wall), open shutters either side outside, a stone-brick sill under it. */
export function window(g, { x, y, z, face: f, h = 2, shutters = true, sill = true }) {
  const a = ALONG[f], o = OUT[f];
  const along = f === "north" || f === "south" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  for (let k = 0; k < h; k++) g.set(x, y + k, z, "glass_pane", along);
  if (shutters) for (const s of [-1, 1]) for (let k = 0; k < h; k++)
    g.set(x + a[0] * s + o[0], y + k, z + a[2] * s + o[2], ...B.trapdoor(SHUTTER, opposite(f), "bottom", true));
  if (sill) g.set(x + o[0], y - 1, z + o[2], ...B.slab("stone_brick", "top"));
}
/** A plank door (lower+upper) in the opening, closed, hinge left. face = the way it looks out. */
export function door(g, { x, y, z, face: f, mat = "oak" }) {
  g.set(x, y, z, ...B.door(mat, f, "lower", "left"));
  g.set(x, y + 1, z, ...B.door(mat, f, "upper", "left"));
}
/** Garden gate: an oak fence gate in the opening, closed. face = the way it looks out. */
export function gate(g, { x, y, z, face: f }) {
  g.set(x, y, z, "oak_fence_gate", { facing: f, open: "false", in_wall: "false" });
}

// ---- furniture ----------------------------------------------------------------------------------------------------
/** A table: fence leg + pressure plate on top (tabletop at y+1). Place one per cell of the table. */
export function table(g, x, y, z) { g.set(x, y, z, ...B.fence("oak")); g.set(x, y + 1, z, "oak_pressure_plate", { powered: "false" }); }
/** A chair of stairs; `sitterFaces` = the way the person looks (toward the table); the stair back is behind them. */
export function chair(g, x, y, z, sitterFaces, mat = "oak") { g.set(x, y, z, ...B.stairs(mat, opposite(sitterFaces))); }
/** A bed: foot at (x,y,z), head one cell on in `facing` (the way the head end lies). color: red|white|blue. */
export function bed(g, x, y, z, facing, color = "red") {
  const o = OUT[facing];
  g.set(x, y, z, `${color}_bed`, { facing, part: "foot" });
  g.set(x + o[0], y, z + o[2], `${color}_bed`, { facing, part: "head" });
}
export const barrel = (g, x, y, z, facing = "up") => g.set(x, y, z, "barrel", { facing, open: "false" });
export const chest = (g, x, y, z, facing = "north") => g.set(x, y, z, "chest", { facing, type: "single", waterlogged: "false" });
/** A lit campfire hearth cell (put it in a brick niche under the chimney). */
export const hearth = (g, x, y, z, facing = "east") => g.set(x, y, z, "campfire", { facing, lit: "true", signal_fire: "false", waterlogged: "false" });
export const furnace = (g, x, y, z, facing = "north", kind = "furnace") => g.set(x, y, z, kind, { facing, lit: "false" });
export const bookshelf = (g, x, y, z) => g.set(x, y, z, "bookshelf");
export const waterCauldron = (g, x, y, z) => g.set(x, y, z, "water_cauldron", { level: "3" });
export const pot = (g, x, y, z, plant = "potted_poppy") => g.set(x, y, z, plant);
/** A lantern standing on a block (hanging=false) or hanging from the block above (hanging=true). */
export const lantern = (g, x, y, z, hanging = false) => g.set(x, y, z, ...B.lantern(hanging));
/** A lamp post: fence posts h high with a lantern on top (lantern at y+h). */
export function lamp(g, x, y, z, h = 3, mat = "dark_oak") {
  for (let k = 0; k < h; k++) g.set(x, y + k, z, ...B.fence(mat));
  g.set(x, y + h, z, ...B.lantern(false));
}
/** A straight run of fence/wall posts from (x0,z0) to (x1,z1) at height y (one axis only); skip = [[x,z]...] gaps. Connections are fixed by fixConnections(). */
export function fenceRun(g, x0, z0, x1, z1, y, mat = "oak", { skip = [], wall = false } = {}) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
    if (skip.some(([sx, sz]) => sx === x && sz === z)) continue;
    g.set(x, y, z, ...(wall ? B.wall(mat) : B.fence(mat)));
  }
}

// ---- the garden ---------------------------------------------------------------------------------------------------
const MAXAGE = { wheat: 7, carrots: 7, potatoes: 7, beetroots: 3 };
/** One crop block at age (clamped to the crop's max) on whatever is below; the farmland under it must be placed by the caller. */
export function crop(g, x, y, z, kind, age = 99) { g.set(x, y, z, kind, { age: String(Math.min(age, MAXAGE[kind])) }); }
/**
 * A raised bed: timber rim (planks at y, a bottom slab on top at y+1), farmland inside at y, crops at y+1.
 * rows = crop kinds in order of increasing x (axis "z": rows run along z) or increasing z (axis "x");
 * water = [[x,z],...] source cells inside the bed (at y, in place of farmland: hydrates farmland within 4 blocks);
 * ripeness: "ripe" | "mixed" (age by position) | "young".
 */
export function plantedBed(g, { x0, z0, x1, z1, rows, axis = "z", water = [], ripeness = "mixed", y = 1, rim = "spruce" }) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) { g.set(x, y, z, `${rim}_planks`); g.set(x, y + 1, z, ...B.slab(rim, "bottom")); continue; }
    if (water.some(([wx, wz]) => wx === x && wz === z)) { g.set(x, y, z, "water", { level: "0" }); continue; }
    g.set(x, y, z, "farmland", { moisture: "7" });
    const i = axis === "z" ? x - x0 - 1 : z - z0 - 1, kind = rows[i % rows.length], pos = axis === "z" ? z : x;
    const age = ripeness === "ripe" ? 99 : ripeness === "young" ? 2 : 3 + ((pos + i) % 5);
    crop(g, x, y + 1, z, kind, age);
  }
}
/** A trained fruit tree (espalier) flat against a wall: log spine, limb logs, a leaf fan 5 wide x 4 tall. (x,z) = spine cell NEXT TO the wall; wall = which side the wall is on. */
export function espalier(g, { x, z, wall, y = 1, leaf = LEAF }) {
  const a = wall === "west" || wall === "east" ? [0, 0, 1] : [1, 0, 0], axis = a[0] ? "x" : "z";
  const at = (o, yy) => [x + a[0] * o, y + yy, z + a[2] * o];
  g.set(x, y - 1, z, "coarse_dirt");
  g.set(...at(0, 0), ...B.log("oak", "y")); g.set(...at(0, 1), ...B.log("oak", "y")); g.set(...at(0, 2), ...B.log("oak", "y"));
  for (const o of [-1, 1]) { g.set(...at(o, 1), leaf); g.set(...at(o, 2), ...B.log("oak", axis)); }
  for (const o of [-2, 2]) g.set(...at(o, 2), leaf);
  for (const o of [-2, -1, 0, 1, 2]) g.set(...at(o, 3), leaf);
}
/** A rose/bean arch across a path: two fence posts, a fence bar over the path, flowering leaves and rose bushes. Spans z=zA..zB at column x (path runs along x). */
export function roseArch(g, { x, zA, zB, y = 1 }) {
  for (const z of [zA, zB]) {
    for (let k = 0; k < 3; k++) g.set(x, y + k, z, ...B.fence("spruce"));
    for (const dx of [-1, 1]) {
      g.set(x + dx, y - 1, z, "coarse_dirt");
      g.set(x + dx, y, z, "rose_bush", { half: "lower" }); g.set(x + dx, y + 1, z, "rose_bush", { half: "upper" });
      g.set(x + dx, y + 2, z, BLOSSOM);
    }
    g.set(x, y + 3, z, BLOSSOM);
  }
  for (let z = zA; z <= zB; z++) { g.set(x, y + 3, z, ...B.fence("spruce")); g.set(x, y + 4, z, BLOSSOM); }
}
/** The well: 3x3 stone-brick ring around a water source, four dark-oak posts, a crossbeam with a chain and bucket, a pyramid roof. */
export function well(g, { cx, cz, y = 1 }) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!dx && !dz) { g.set(cx, y, cz, "water", { level: "0" }); continue; }
    g.set(cx + dx, y, cz + dz, dx && dz ? "mossy_stone_bricks" : "stone_bricks");
  }
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) for (let k = 1; k <= 3; k++) g.set(cx + dx, y + k, cz + dz, ...B.log("dark_oak", "y"));
  for (const dx of [-1, 0, 1]) g.set(cx + dx, y + 3, cz, ...B.log("spruce", "x"));
  g.set(cx, y + 2, cz, ...B.chain("y")); g.set(cx, y + 1, cz, "cauldron");
  roof(g, [[cx - 1, cz - 1, cx + 1, cz + 1]], "pyramid", { y: y + 4, material: "spruce", overhang: 1 });
}
/** A sundial: stone-brick wall pedestal, smooth-stone dial, lightning-rod gnomon. */
export function sundial(g, { x, z, y = 1 }) {
  g.set(x, y, z, ...B.wall("stone_brick")); g.set(x, y + 1, z, ...B.wall("stone_brick"));
  g.set(x, y + 2, z, ...B.slab("smooth_stone", "bottom")); g.set(x, y + 3, z, "lightning_rod", { facing: "up", powered: "false" });
}
/** A garden urn on a pedestal. */
export function urn(g, { x, z, y = 1 }) {
  g.set(x, y, z, ...B.wall("stone_brick")); g.set(x, y + 1, z, "stone_bricks"); g.set(x, y + 2, z, "decorated_pot");
}

// ---- small buildings ----------------------------------------------------------------------------------------------
/** Glasshouse: stone-brick plinth, glass walls between birch corner posts, a stepped glass gable roof (ridge along x), birch-slab ridge. Door gap comes from OPENINGS. */
export function greenhouse(g, { x0, z0, x1, z1, y = 1 }) {
  const zm = Math.floor((z0 + z1) / 2);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    const post = (x === x0 || x === x1) && (z === z0 || z === z1);
    for (let k = 0; k <= 2; k++) {
      if (isOpening(x, y + k, z)) continue;
      if (post) g.set(x, y + k, z, ...B.log("birch", "y"));
      else g.set(x, y + k, z, k === 0 ? "stone_bricks" : "glass");
    }
  }
  // roof: eaves at y+3 (z0 and z1 rows), one step in per course up to the ridge row zm
  for (let s = 0; z0 + s <= zm; s++) {
    const za = z0 + s, zb = z1 - s;
    for (let x = x0; x <= x1; x++) {
      const end = x === x0 || x === x1;
      g.set(x, y + 3 + s, za, end ? "birch_planks" : "glass"); g.set(x, y + 3 + s, zb, end ? "birch_planks" : "glass");
    }
    if (s > 0) for (let z = za; z <= zb; z++) { g.set(x0, y + 3 + s - 1, z, "glass"); g.set(x1, y + 3 + s - 1, z, "glass"); }
  }
  for (let x = x0; x <= x1; x++) g.set(x, y + 3 + (zm - z0) + 1, zm, ...B.slab("birch", "bottom"));
}
/** Cold frame: spruce-plank ring (1 high), glass-pane ring on it, farmland with seedling carrots inside. */
export function coldFrame(g, { x0, z0, x1, z1, y = 1 }) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) { g.set(x, y, z, "spruce_planks"); g.set(x, y + 1, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false" }); }
    else { g.set(x, y, z, "farmland", { moisture: "7" }); crop(g, x, y + 1, z, "carrots", 1 + ((x + z) % 3)); }
  }
}
/** Tool shed: plank walls with spruce-log corners (y..y+2), gabled spruce roof by roof(); door gap from OPENINGS. */
export function toolShed(g, { x0, z0, x1, z1, y = 1 }) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    const post = (x === x0 || x === x1) && (z === z0 || z === z1);
    for (let k = 0; k <= 2; k++) { if (isOpening(x, y + k, z)) continue; if (post) g.set(x, y + k, z, ...B.log("spruce", "y")); else g.set(x, y + k, z, "spruce_planks"); }
  }
  roof(g, [[x0, z0, x1, z1]], "gable", { y: y + 3, material: "dark_oak", overhang: 1 });
}

// ---- post-pass: connect fences, walls, panes and bars to their neighbours (the renderer draws states literally) -----
const NOT_FULL = /(stairs|slab|lantern|banner|torch|chain|trapdoor|campfire|rod|sign|door|carpet|plate|pot|bush|tulip|allium|poppy|daisy|cornflower|dandelion|lilac|peony|wheat|carrots|potatoes|beetroots|_bed$|vine|water|cauldron|leaves|fern|grass$|farmland)/;
/** Call once on the raw grid after runParts. Returns how many blocks were re-set. */
export function fixConnections(g) {
  const D4 = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const full = (x, y, z) => { const b = g.blockAt(x, y, z).replace("minecraft:", ""); return b !== "air" && !NOT_FULL.test(b) && !/(_fence|_wall|_pane|iron_bars)$/.test(b); };
  let n = 0;
  for (const c of [...g.cells.values()]) {
    const b = c.block.replace("minecraft:", ""), [x, y, z] = c.pos;
    const isFence = /_fence$/.test(b), isWall = /_wall$/.test(b), isPane = /(glass_pane|iron_bars)$/.test(b);
    if (!isFence && !isWall && !isPane) continue;
    const st = {};
    for (const [d, [dx, dz]] of Object.entries(D4)) {
      const nb = g.blockAt(x + dx, y, z + dz).replace("minecraft:", "");
      const same = isFence ? /_fence$|_fence_gate$/.test(nb) : isWall ? /_wall$/.test(nb) : /(glass_pane|iron_bars)$/.test(nb);
      const solid = full(x + dx, y, z + dz);
      st[d] = isWall ? (same || solid ? "low" : "none") : String(same || solid);
    }
    if (isWall) { const k = Object.values(st).filter((v) => v !== "none").length; st.up = String(!(k === 2 && ((st.north !== "none" && st.south !== "none") || (st.east !== "none" && st.west !== "none"))) || !g.isAir(x, y + 1, z)); }
    st.waterlogged = "false";
    g.set(x, y, z, c.block, st, c.nbt); n++;
  }
  return n;
}
