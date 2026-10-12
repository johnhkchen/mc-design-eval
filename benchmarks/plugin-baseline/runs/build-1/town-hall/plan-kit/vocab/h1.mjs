// Town hall vocabulary, batch 1: the nine helpers plan.md names (quoins, window bays, main door, pediment oculus, clock
// face, spire finial, fireplace, front steps, oak tree). Each takes the grid first, then its position (and facing where
// it has one), then an opts object. Coordinates are the grid's (x east, y up, z south); faces are north|south|east|west.
//
// Writes go only into air unless opts.over is true (a dressing that replaces a wall course). A refused cell is listed in
// the result, never thrown. Each helper returns { cells, refused }: blocks written, and [x, y, z, block] for cells it left.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ cells: 0, refused: [] });

function put(g, r, x, y, z, block, state, over = false) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) { r.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state);
  r.cells++;
}

function assertFace(face, names = ["north", "south", "east", "west"]) {
  if (!names.includes(face)) throw new Error(`face must be ${names.join("|")}, got ${face}`);
}

// Wall cell from its face, its plane (z for a north/south wall, x for east/west) and its position along the wall.
const wallXZ = (face, plane, along) => (face === "north" || face === "south" ? [along, plane] : [plane, along]);
// The direction that runs along the wall with increasing coordinate.
const alongDir = (face) => (face === "north" || face === "south" ? "east" : "south");
// Glass panes join along the wall, so a run of them reads as one frame in its plane.
const pane = (face) => (face === "north" || face === "south"
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });

/**
 * Quartz quoins on a corner at (x, z): course i (y0 + i) is long, two cells from the corner along the wall, when i is
 * even, and short (the corner cell only) when odd. `face` is the way the wall runs from the corner.
 */
export function quoinColumn(g, x, z, face, y0, y1, opts = {}) {
  assertFace(face);
  const r = result(), [dx, , dz] = DIRS[face];
  for (let y = y0; y <= y1; y++) {
    put(g, r, x, y, z, "quartz_block", null, opts.over);
    if ((y - y0) % 2 === 0) put(g, r, x + dx, y, z + dz, "quartz_block", null, opts.over);
  }
  return r;
}

/**
 * A glass_pane window `w` wide and `h` tall, starting at along-wall position `at`, in the wall plane `plane`.
 * opts.sill: a quartz_slab sill (bottom half) proud one cell out of the wall, at y0 - 1.
 */
export function windowBay(g, face, plane, at, w, y0, h, opts = {}) {
  assertFace(face);
  const r = result(), [ox, , oz] = DIRS[face];
  for (let i = 0; i < w; i++) {
    const [x, z] = wallXZ(face, plane, at + i);
    for (let j = 0; j < h; j++) put(g, r, x, y0 + j, z, "glass_pane", pane(face), opts.over);
    if (opts.sill) {
      const [sb, ss] = B.slab("quartz", "bottom");
      put(g, r, x + ox, y0 - 1, z + oz, sb, ss, opts.over);
    }
  }
  return r;
}

/**
 * The main door on the wall plane `plane`, centred on along-wall position `cx`: dark_oak_door (both halves, lower at
 * y0), glass sidelights either side for y0..y0+1, a 3-wide glass fanlight at y0+2..y0+4, and a flat arch at y0+5 of
 * upside-down quartz stairs with a chiseled keystone over the centre.
 */
export function mainDoor(g, cx, plane, face, y0, opts = {}) {
  assertFace(face);
  const r = result(), along = alongDir(face), inward = OPPOSITE[along];
  const at = (a, y, block, state) => { const [x, z] = wallXZ(face, plane, a); put(g, r, x, y, z, block, state, opts.over); };
  at(cx, y0, ...B.door("dark_oak", face, "lower", "left"));
  at(cx, y0 + 1, ...B.door("dark_oak", face, "upper", "left"));
  for (const s of [-1, 1]) for (let y = y0; y <= y0 + 1; y++) at(cx + s, y, "glass_pane", pane(face));
  for (let s = -1; s <= 1; s++) for (let y = y0 + 2; y <= y0 + 4; y++) at(cx + s, y, "glass_pane", pane(face));
  // each arch stair lies with its lip toward the keystone
  at(cx - 1, y0 + 5, ...B.stairs("quartz", along, "top"));
  at(cx + 1, y0 + 5, ...B.stairs("quartz", inward, "top"));
  at(cx, y0 + 5, "chiseled_quartz_block", null);
  return r;
}

/**
 * The temple gable's tympanum on the front plane `plane` (z): a smooth_quartz triangle from the base course baseY up to
 * the apex apexY, with an oculus centred at (cx, cy): a chiseled_quartz_block ring round a glass_pane eye.
 */
export function pedimentOculus(g, cx, plane, baseY, apexY, cy, opts = {}) {
  const r = result();
  const inOculus = (x, y) => Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
  for (let y = baseY; y <= apexY; y++) {
    const half = apexY - y;
    for (let x = cx - half; x <= cx + half; x++) if (!inOculus(x, y)) put(g, r, x, y, plane, "smooth_quartz", null, opts.over);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const eye = dx === 0 && dy === 0;
    put(g, r, cx + dx, cy + dy, plane, eye ? "glass_pane" : "chiseled_quartz_block", eye ? pane("north") : null, opts.over);
  }
  return r;
}

/**
 * A 3x3 clock face on a tower wall (plane `plane`), centred on along-wall position `at`, rows y0..y0+2. White dial,
 * chiseled corners, and black hands on the centre column at y0+1 and y0+2.
 */
export function clockFace(g, face, plane, at, y0 = 28, opts = {}) {
  assertFace(face);
  const r = result();
  for (let a = -1; a <= 1; a++) for (let j = 0; j <= 2; j++) {
    const [x, z] = wallXZ(face, plane, at + a);
    const corner = a !== 0 && (j === 0 || j === 2);
    const block = a === 0 && j > 0 ? "black_concrete" : corner ? "chiseled_quartz_block" : "white_concrete";
    put(g, r, x, y0 + j, z, block, null, opts.over);
  }
  return r;
}

/**
 * The spire's lightning-rod finial: two rods at (cx, y0..y0+1, cz), facing up. The copper pyramid under them is the
 * roof tool's (`$MCD roof`, pyramid, copper palette), not written here.
 */
export function copperSpire(g, cx, cz, y0 = 42, opts = {}) {
  const r = result();
  for (let y = y0; y <= y0 + 1; y++) put(g, r, cx, y, cz, "lightning_rod", { facing: "up", powered: "false" }, opts.over);
  return r;
}

/**
 * A fireplace firebox in the wall on side `side` (west or east, the side the back wall is on): the opening at x, two
 * cells deep from z0, two cells high from y0. A lit campfire sits at the back, a stone_bricks hearth beside it, and a
 * lintel of two upside-down brick stairs closes the top at y0 + 2.
 */
export function fireplace(g, x, z0, side, y0, opts = {}) {
  assertFace(side, ["west", "east"]);
  const r = result(), room = OPPOSITE[side];
  put(g, r, x, y0, z0, "campfire", { facing: room, lit: "true" }, opts.over);
  put(g, r, x, y0, z0 + 1, "stone_bricks", null, opts.over);
  for (let z = z0; z <= z0 + 1; z++) put(g, r, x, y0 + 2, z, ...B.stairs("brick", side, "top"), opts.over);
  return r;
}

/**
 * Two flights of stone_brick_stairs climbing toward `facing` (north or south) across x0..x1: the first tread at
 * (x, y0, z0), the second one step on at (x, y0 + 1, z0 + one cell toward `facing`).
 */
export function frontSteps(g, x0, x1, z0, y0, facing, opts = {}) {
  assertFace(facing, ["north", "south"]);
  const r = result(), dz = DIRS[facing][2];
  for (let x = x0; x <= x1; x++) {
    put(g, r, x, y0, z0, ...B.stairs("stone_brick", facing, "bottom"), opts.over);
    put(g, r, x, y0 + 1, z0 + dz, ...B.stairs("stone_brick", facing, "bottom"), opts.over);
  }
  return r;
}

/**
 * An oak at (x, z): a six-cell log trunk from y0 (axis y), and a radius-3 crown of persistent oak_leaves centred on the
 * fifth trunk cell. Writes nothing at y0 or below, so the ground stays with the grounds part.
 */
export function oakTree(g, x, z, y0 = 1, opts = {}) {
  const r = result(), yc = y0 + 4;
  for (let y = y0; y <= y0 + 5; y++) put(g, r, x, y, z, ...B.log("oak", "y"), opts.over);
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) {
    if (dx * dx + dy * dy + dz * dz > 9) continue;
    if (dx === 0 && dz === 0 && yc + dy >= y0 && yc + dy <= y0 + 5) continue; // the trunk
    put(g, r, x + dx, yc + dy, z + dz, "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }, opts.over);
  }
  return r;
}
