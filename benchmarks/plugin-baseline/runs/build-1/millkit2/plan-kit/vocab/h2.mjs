// Vocabulary helpers from plan.md VOCABULARY (share h2): lamp_post, clapboard_wall, shutter_pair, front_steps,
// hearth_nook, hanging_lantern, woodpile, swing, tapered_post. Palette ids are literals; nothing is imported from
// vocab.mjs or the other vocab/ files. Every helper takes the grid first, then its position (the cell it is anchored
// on, and its facing where it has one), then an optional opts object, and returns { placed, skipped, clipped, box }:
// box is the footprint it may write. A write outside the box throws; a cell that is not air is skipped, so nothing is
// laid under ground, floors or earlier parts' blocks.
import { B, DIRS, shutter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The writer: the only way a helper writes. Air only; a write outside the box throws; a cell outside the grid is clipped.
// `grid` is a view of g for shape tools (shutter) that call g.set themselves, so they obey the same rules.
function writer(g, box) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const w = { placed: 0, skipped: 0, clipped: 0, box };
  w.set = (x, y, z, block, state, nbt) => {
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) throw new Error(`write outside footprint ${box}: ${x},${y},${z} ${block}`);
    if (!g.inBounds(x, y, z)) { w.clipped++; return w; }
    if (!g.isAir(x, y, z)) { w.skipped++; return w; }
    g.set(x, y, z, block, state, nbt);
    w.placed++;
    return w;
  };
  w.grid = new Proxy(g, { get(t, p) { if (p === "set") return w.set; const v = Reflect.get(t, p); return typeof v === "function" ? v.bind(t) : v; } });
  return w;
}

const result = (w) => ({ placed: w.placed, skipped: w.skipped, clipped: w.clipped, box: w.box });

/** A standing lamp post on the lane's edge: spruce fence y..y+2, standing lantern at y+3. (x, y, z) = the fence's foot. */
export function lamp_post(g, x, y, z) {
  const w = writer(g, [x, y, z, x, y + 3, z]);
  for (let i = 0; i < 3; i++) w.set(x, y + i, z, ...B.fence("spruce"));
  w.set(x, y + 3, z, ...B.lantern(false));
  return result(w);
}

/**
 * Wall shell over box [x0,y0,z0,x1,y1,z1]: the outer ring only (no floor, no ceiling). field: a plain block id for the
 * walls; trim: a LOG id (e.g. stripped_pale_oak_log) for the corner boards (axis y) and the plates at y0 and y1 (axis
 * along the run). opts.open: boxes [x0,y0,z0,x1,y1,z1] left as air (window and door openings).
 */
export function clapboard_wall(g, box, field, trim, { open = [] } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const w = writer(g, box);
  const inOpen = (x, y, z) => open.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    if (!ring || inOpen(x, y, z)) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const plate = y === y0 || y === y1;
    if (corner) w.set(x, y, z, ...B.pillar(trim, "y"));
    else if (plate) w.set(x, y, z, ...B.pillar(trim, z === z0 || z === z1 ? "x" : "z"));
    else w.set(x, y, z, field, {});
  }
  return result(w);
}

/**
 * A pair of open trapdoor shutters beside a window. (x, y, z) = the window's first cell on its wall, bottom-left as seen
 * from outside; face = the way the wall looks (north for a north wall); width = the window's width along the wall;
 * height = shutter rows. Shutters go in the cell in front of the wall, one each side of the window.
 */
export function shutter_pair(g, x, y, z, face, wood, { width = 1, height = 2 } = {}) {
  const [dx, dz] = DIRS[face];
  const [ux, uz] = face === "north" || face === "south" ? [1, 0] : [0, 1];   // along the wall
  const front = [[x - ux, z - uz], [x + ux * width, z + uz * width]].map(([cx, cz]) => [cx + dx, cz + dz]);
  const xs = front.map(([cx]) => cx), zs = front.map(([, cz]) => cz);
  const w = writer(g, [Math.min(...xs), y, Math.min(...zs), Math.max(...xs), y + height - 1, Math.max(...zs)]);
  for (const [sx, sz] of front) shutter(w.grid, [sx, y, sz], face, wood, { height });
  return result(w);
}

/** Front steps: a row of stairs at height y from x0 to x1 on row z, rising toward facing (south: up toward the deck). */
export function front_steps(g, x0, x1, y, z, { facing = "south", material = "spruce" } = {}) {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)];
  const w = writer(g, [a, y, z, b, y, z]);
  for (let x = a; x <= b; x++) w.set(x, y, z, ...B.stairs(material, facing, "bottom"));
  return result(w);
}

/**
 * A lit furnace on a stone hearth against a chimney wall. (x, y, z) = the furnace cell on the standing level; facing =
 * the way its front looks (into the room, away from the chimney wall). A stone-brick mantle sits above it. Only these two
 * cells are written: the floor and the 2-high lane in front of the furnace stay clear.
 */
export function hearth_nook(g, x, y, z, facing) {
  const w = writer(g, [x, y, z, x, y + 1, z]);
  w.set(x, y, z, "furnace", { facing, lit: "true" });
  w.set(x, y + 1, z, "stone_bricks", {});
  return result(w);
}

/**
 * A hanging lantern under a block: (x, y, z) = the lantern's cell. Hangs only when the cell above is solid; with air above
 * it places nothing and returns hung: false (the ceiling must be built first).
 */
export function hanging_lantern(g, x, y, z) {
  const w = writer(g, [x, y, z, x, y, z]);
  const hung = !g.isAir(x, y + 1, z);
  if (hung) w.set(x, y, z, ...B.lantern(true));
  return { ...result(w), hung };
}

/**
 * A woodpile lean-to over box [x0,y0,z0,x1,y1,z1]: spruce fence posts at the corners (y0..y1-1), a spruce slab roof row
 * at y1 over the whole box, stripped oak logs stacked along x in the two back rows (y0..y0+1), oak log rounds on the
 * front row between the posts.
 */
export function woodpile(g, [x0, y0, z0, x1, y1, z1]) {
  const w = writer(g, [x0, y0, z0, x1, y1, z1]);
  for (const x of [x0, x1]) for (const z of [z0, z1]) for (let y = y0; y < y1; y++) w.set(x, y, z, ...B.fence("spruce"));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.set(x, y1, z, ...B.slab("spruce", "bottom"));
  for (let y = y0; y <= Math.min(y0 + 1, y1 - 1); y++) for (let z = z1 - 1; z <= z1; z++) for (let x = x0; x <= x1; x++) w.set(x, y, z, ...B.log("stripped_oak", "x"));
  for (let x = x0 + 1; x <= x1 - 1; x++) w.set(x, y0, z0 + 1, ...B.log("oak", "y"));
  return result(w);
}

/**
 * A tree swing: a spruce slab seat (top half) at (x, y, z), an iron chain up to y+3, and a jungle log branch along x at
 * y+4 over x-1..x, the chain hanging from its x cell.
 */
export function swing(g, x, y, z) {
  const w = writer(g, [x - 1, y, z, x, y + 4, z]);
  w.set(x, y, z, ...B.slab("spruce", "top"));
  for (let i = 1; i <= 3; i++) w.set(x, y + i, z, ...B.chain("y"));
  w.set(x - 1, y + 4, z, ...B.log("jungle", "x"));
  w.set(x, y + 4, z, ...B.log("jungle", "x"));
  return result(w);
}

/** A tapered porch post: bricks at y, a brick wall post at y+1, a stripped pale oak log cap at y+2. (x, y, z) = the base. */
export function tapered_post(g, x, y, z) {
  const w = writer(g, [x, y, z, x, y + 2, z]);
  w.set(x, y, z, "bricks", {});
  w.set(x, y + 1, z, "brick_wall", { up: "true" });
  w.set(x, y + 2, z, ...B.pillar("stripped_pale_oak_log", "y"));
  return result(w);
}
