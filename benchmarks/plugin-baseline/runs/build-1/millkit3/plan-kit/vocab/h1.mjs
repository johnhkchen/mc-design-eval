// Part h1 of the mill village kit 3 (VOCABULARY in plan.md). Absolute coordinates; the caller applies the plot offset.
// Every helper writes only into air (place()), so nothing an earlier part built is overwritten; a refused cell is
// reported in the result, never thrown. Two named exceptions: lane_strip lays the ground it is named for, and
// mule_stall's floor and porch_run's gap are options that say so.
// Conventions: `face` = the way a thing looks out of its wall (the wall is the cell behind it, at x - facing).
// bed_set's facing is the head direction (the head is against the wall it points at), as in the toolkit's bed().
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FENCE = { north: "false", east: "false", south: "false", west: "false" };
const STEP_SLAB = "smooth_stone_slab";
const logState = (id, axis) => (/_log$/.test(id) ? { axis } : undefined);
const railState = (id) => (/_fence$/.test(id) ? { north: "false", south: "false", east: "true", west: "true" } : undefined);
const step = (face) => { const [dx, , dz] = DIRS[face]; return [dx, dz]; };
const norm = (b) => (Array.isArray(b) ? b : [b, undefined]);
const inside = ([a, b, c, d, e, f], x, y, z) =>
  x >= Math.min(a, d) && x <= Math.max(a, d) && y >= Math.min(b, e) && y <= Math.max(b, e) && z >= Math.min(c, f) && z <= Math.max(c, f);

/** Write [x, y, z, block, state] cells into air only (force: any cell inside the grid). A cell listed twice in one call
 *  keeps its first block. Returns { placed, refused: [[x, y, z, block]] }; all: write nothing unless every cell fits. */
function place(g, cells, { force = false, all = false } = {}) {
  const claimed = new Set(), ok = [], refused = [];
  for (const [x, y, z, block, state] of cells) {
    const k = `${x},${y},${z}`;
    const free = !claimed.has(k) && g.inBounds(x, y, z) && (force || g.isAir(x, y, z));
    claimed.add(k);
    if (free) ok.push([x, y, z, block, state]);
    else refused.push([x, y, z, block]);
  }
  if (all && refused.length) return { placed: 0, refused };
  for (const [x, y, z, block, state] of ok) g.set(x, y, z, block, state);
  return { placed: ok.length, refused };
}
const join = (...rs) => ({ placed: rs.reduce((n, r) => n + r.placed, 0), refused: rs.flatMap((r) => r.refused) });

/** Site lane (P6): z0 and z4 coarse_dirt, z1 and z3 dirt_path, z2 gravel at groundY; dirt at groundY-1, stone at
 *  groundY-2 under each. The footprint is the ground itself, so this is the one helper that writes non-air. */
export function lane_strip(g, x0, x1, groundY = 0) {
  const top = ["coarse_dirt", "dirt_path", "gravel", "dirt_path", "coarse_dirt"];
  const cells = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = 0; z < 5; z++) cells.push([x, groundY, z, top[z]], [x, groundY - 1, z, "dirt"], [x, groundY - 2, z, "stone"]);
  return place(g, cells, { force: true });
}

/** One wall line, box = [x0, y0, z0, x1, y1, z1] with x0 == x1 or z0 == z1; y0..y1 is the wall height. The field
 *  fills it; corner boards (log, axis y) stand at both ends; head plates (log along the wall) at y6 and y11; a floor
 *  belt at y7 when opts.belt is given (block or [block, state]); opts.openings (boxes) are left AIR. */
export function clapboard_wall(g, box, field, corner, plate, opts = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  if (x0 !== x1 && z0 !== z1) throw new Error("clapboard_wall: box must be one wall line (x0 == x1 or z0 == z1)");
  const along = x0 === x1 ? "z" : "x";
  const lo = along === "z" ? Math.min(z0, z1) : Math.min(x0, x1);
  const hi = along === "z" ? Math.max(z0, z1) : Math.max(x0, x1);
  const want = new Map();
  const put = (t, y, block, state) => {
    const [x, z] = along === "z" ? [x0, t] : [t, z0];
    want.set(`${x},${y},${z}`, [x, y, z, block, state]);
  };
  const course = (y, block, state) => { if (y >= y0 && y <= y1) for (let t = lo; t <= hi; t++) put(t, y, block, state); };
  for (let y = y0; y <= y1; y++) course(y, ...norm(field));
  if (opts.belt) course(7, ...norm(opts.belt));
  course(6, plate, logState(plate, along));
  course(11, plate, logState(plate, along));
  for (const t of [lo, hi]) for (let y = y0; y <= y1; y++) put(t, y, corner, logState(corner, "y"));
  const openings = opts.openings ?? [];
  return place(g, [...want.values()].filter(([x, y, z]) => !openings.some((b) => inside(b, x, y, z))));
}

/** Door in a wall, facing out (`face`): both halves at (x, y) and (x, y+1), hinge left, all or nothing. Optional:
 *  a glass_pane transom at y+2 in the wall plane, and a step slab one cell out at y. */
export function door_unit(g, x, y, z, face, wood, transom = false) {
  const [dx, dz] = step(face), door = `${wood}_door`;
  const half = (h) => ({ facing: face, half: h, hinge: "left", open: "false" });
  const required = place(g, [[x, y, z, door, half("lower")], [x, y + 1, z, door, half("upper")]], { all: true });
  if (required.refused.length) return required;
  const along = face === "north" || face === "south";
  const extra = [[x + dx, y, z + dz, STEP_SLAB, { type: "bottom" }]];
  if (transom) extra.push([x, y + 2, z, "glass_pane", along ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" }]);
  return join(required, place(g, extra));
}

/** Porch (P4): deck over x0..x1, z0..z1 at deckY; posts [x, z, block?] at y3..5 (stripped_birch_log unless opts.post);
 *  a log beam along x at y6 on each post row; a rail at y3 along the front row z0 with opts.gap = [xa, xb] left open
 *  for the steps; opts.bracket = wood for upside-down stair brackets under the beam at the front and back post rows. */
export function porch_run(g, x0, x1, z0, z1, posts, beam, rail, deck, deckY, opts = {}) {
  const { gap = null, post: postBlock = "stripped_birch_log", bracket = "birch" } = opts;
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1);
  const deckCells = [];
  for (let x = xa; x <= xb; x++) for (let z = za; z <= zb; z++) deckCells.push([x, deckY, z, deck]);
  const frame = [];
  for (const [px, pz, pb = postBlock] of posts) for (let y = 3; y <= 5; y++) frame.push([px, y, pz, pb, logState(pb, "y")]);
  for (const bz of new Set(posts.map(([, pz]) => pz))) for (let x = xa; x <= xb; x++) frame.push([x, 6, bz, beam, logState(beam, "x")]);
  const railCells = [];
  for (let x = xa; x <= xb; x++) if (!(gap && x >= gap[0] && x <= gap[1])) railCells.push([x, 3, z0, rail, railState(rail)]);
  const brackets = [];
  if (bracket) for (const [px, pz] of posts) {
    if (pz !== z0 && pz !== z1) continue;
    const front = pz === z0;
    brackets.push([px, 5, front ? pz + 1 : pz - 1, `${bracket}_stairs`, { facing: front ? "north" : "south", half: "top", shape: "straight" }]);
  }
  return join(place(g, deckCells), place(g, frame), place(g, railCells), place(g, brackets));
}

/** Ladder (P5/P6): one ladder per block from y0 to y1 at (x, z). `facing` is the way it faces out of its wall, so the
 *  solid block behind it is at x - facing; a cell with no solid wall behind is refused. opts.hatch = wood: an open
 *  trapdoor in the hole at y1+1, hinged on the wall. */
export function ladder_run(g, x, y0, y1, z, facing, opts = {}) {
  const [dx, dz] = step(facing), cells = [], unsupported = [];
  for (let y = y0; y <= y1; y++) {
    if (g.isAir(x - dx, y, z - dz)) unsupported.push([x, y, z, "ladder"]);
    else cells.push([x, y, z, "ladder", { facing }]);
  }
  if (opts.hatch) cells.push([x, y1 + 1, z, `${opts.hatch}_trapdoor`, { facing: OPPOSITE[facing], half: "bottom", open: "true" }]);
  return join(place(g, cells), { placed: 0, refused: unsupported });
}

/** Bed (rooms): foot at [x, y, z], head one step toward `facing`, its head cell against a solid wall, on a solid floor,
 *  with 2 clear blocks above both halves. Places nothing unless all of that holds. Writes the states red_bed has
 *  (facing, part) and no others. */
export function bed_set(g, [x, y, z], facing, colour = "red") {
  const [dx, dz] = step(facing), hx = x + dx, hz = z + dz, refused = [];
  const no = (cx, cy, cz, why) => refused.push([cx, cy, cz, why]);
  for (const [cx, cz] of [[x, z], [hx, hz]]) {
    if (!g.isAir(cx, y, cz)) no(cx, y, cz, "not air");
    if (g.isAir(cx, y - 1, cz)) no(cx, y - 1, cz, "no floor");
    for (const dy of [1, 2]) if (!g.isAir(cx, y + dy, cz)) no(cx, y + dy, cz, "headroom");
  }
  if (g.isAir(hx + dx, y, hz + dz)) no(hx + dx, y, hz + dz, "head not against a wall");
  if (refused.length) return { placed: 0, refused };
  const b = `${colour}_bed`;
  return place(g, [[x, y, z, b, { facing, part: "foot" }], [hx, y, hz, b, { facing, part: "head" }]], { all: true });
}

/** Shelf (rooms): a top slab (spruce by default) at (x, y, z) against the wall behind it (x - face), with one item on
 *  its top at y+1: flower_pot, decorated_pot or candle. All or nothing. */
export function shelf(g, x, y, z, face, item = "flower_pot", wood = "spruce") {
  const [dx, dz] = step(face);
  if (g.isAir(x - dx, y, z - dz)) return { placed: 0, refused: [[x, y, z, "no wall behind"]] };
  const itemState = item === "candle" ? { candles: "1", lit: "false" } : undefined;
  return place(g, [[x, y, z, `${wood}_slab`, { type: "top" }], [x, y + 1, z, item, itemState]], { all: true });
}

/** Mule stall (P5): a 2 x 2 pen at x0..x0+1, z0..z0+1, the aisle on the `dir` side (east | west). Row z0: spruce_fence
 *  partition y1..2 on the aisle column, hay_block rack at y1 on the back column. Row z0+1: spruce_fence_gate on the
 *  aisle column facing dir, barrel facing up as the trough on the back column. opts.floor: packed_mud at y0 (off by
 *  default: an earlier part owns the floor). */
export function mule_stall(g, x0, z0, dir, opts = {}) {
  if (dir !== "east" && dir !== "west") throw new Error(`mule_stall: dir must be east or west, got ${dir}`);
  const aisle = dir === "east" ? x0 + 1 : x0, back = dir === "east" ? x0 : x0 + 1;
  const cells = [
    [aisle, 1, z0, "spruce_fence", FENCE], [aisle, 2, z0, "spruce_fence", FENCE],
    [back, 1, z0, "hay_block", { axis: "y" }],
    [aisle, 1, z0 + 1, "spruce_fence_gate", { facing: dir, in_wall: "false", open: "false" }],
    [back, 1, z0 + 1, "barrel", { facing: "up", open: "false" }],
  ];
  if (opts.floor) for (let x = x0; x <= x0 + 1; x++) for (let z = z0; z <= z0 + 1; z++) cells.push([x, 0, z, "packed_mud"]);
  return place(g, cells);
}

/** Bread oven (P6), footprint x..x+4, z..z+3, y..y+3 (plinth at y, default 1). Plinth cobbled_deepslate, with a
 *  hay_block under the campfire at the back (x+2, z+2). Brick walls at y+1..y+2 with a 1-wide mouth on the north
 *  side (x+2, z) left AIR. Lit campfire at (x+2, y+1, z+2). Upside-down brick_stairs vault at y+3 (the mouth's lintel
 *  included) with a brick_slab top crown; the flue cell (x+2, y+3, z+2) stays AIR for the stack. */
export function bread_oven(g, x, z, y = 1) {
  const ring = (dx, dz) => dx === 0 || dx === 4 || dz === 0 || dz === 3;
  const inward = (dx, dz) => (dz === 0 ? "south" : dz === 3 ? "north" : dx === 0 ? "east" : "west");
  const plinth = [], walls = [], vault = [];
  for (let dx = 0; dx <= 4; dx++) for (let dz = 0; dz <= 3; dz++) {
    const X = x + dx, Z = z + dz, back = dx === 2 && dz === 2;
    plinth.push(back ? [X, y, Z, "hay_block", { axis: "y" }] : [X, y, Z, "cobbled_deepslate"]);
    if (ring(dx, dz) && !(dx === 2 && dz === 0)) walls.push([X, y + 1, Z, "bricks"], [X, y + 2, Z, "bricks"]);
    if (ring(dx, dz)) vault.push([X, y + 3, Z, "brick_stairs", { facing: inward(dx, dz), half: "top", shape: "straight" }]);
    else if (!back) vault.push([X, y + 3, Z, "brick_slab", { type: "top" }]);
  }
  const fire = [[x + 2, y + 1, z + 2, "campfire", { facing: "north", lit: "true" }]];
  return join(place(g, plinth), place(g, walls), place(g, fire), place(g, vault));
}

/** Rafter tails (P3): spruce_fence stubs at (x, y, z) every 2 blocks from z0 to z1, under an eave. */
export function rafter_tails(g, x, z0, z1, y) {
  const cells = [];
  for (let z = z0; z <= z1; z += 2) cells.push([x, y, z, "spruce_fence", FENCE]);
  return place(g, cells);
}
