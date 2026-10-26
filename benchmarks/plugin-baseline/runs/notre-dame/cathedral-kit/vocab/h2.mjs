// plan.md VOCABULARY, second set: ashlarWall, portal, colonnade, gargoyle, ringWall, statue, lampPost.
// Every helper takes the grid first, then its position (and facing where it has one). It writes only into air
// (and only inside its own footprint): an earlier part's block is never replaced. { over: true } replaces instead.
// Block ids are plan.md's PALETTE, checked against 1.21.1.
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FACES = ["west", "east", "north", "south"];

// One block, into air only. Returns 1 when placed, 0 when the cell is outside the grid or already holds a block.
function put(g, x, y, z, block, state, { over = false } = {}) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

function checkFace(face, name) {
  if (!FACES.includes(face)) throw new Error(`${name}: face must be one of ${FACES.join(", ")}, got ${face}`);
}

// Wall stone of plan.md's MATERIALS: cut_sandstone string course every 8 y, ~10% sandstone below y 12 (a fixed
// hash of the cell, so every part picks the same cells), smooth_sandstone body.
function stoneAt(x, y, z) {
  if (y % 8 === 0) return "cut_sandstone";
  if (y < 12 && ((((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 100) < 10) return "sandstone";
  return "smooth_sandstone";
}

// Coordinates on a wall: u runs along the wall (+u is south on a west/east face, east on a north/south face), depth d
// runs into the building. cell(u, y, d) gives the world cell; toward(u) is the facing that points at the centre line.
function frame(face, x, z) {
  const ew = face === "west" || face === "east";
  const inward = DIRS[OPPOSITE[face]];
  const alongName = ew ? "south" : "east";
  const along = DIRS[alongName];
  return {
    cell: (u, y, d) => [x + u * along[0] + d * inward[0], y, z + u * along[2] + d * inward[2]],
    toward: (u) => (u > 0 ? OPPOSITE[alongName] : alongName),
  };
}

/**
 * ashlarWall(box, face): smooth_sandstone wall over box = [x0,y0,z0,x1,y1,z1] (inclusive), its outside facing `face`.
 * A cut_sandstone string course every 8 y, cut_sandstone quoins at both ends of the run, ~10% sandstone below y 12.
 */
export function ashlarWall(g, box, face, opts = {}) {
  checkFace(face, "ashlarWall");
  const lo = [Math.min(box[0], box[3]), Math.min(box[1], box[4]), Math.min(box[2], box[5])];
  const hi = [Math.max(box[0], box[3]), Math.max(box[1], box[4]), Math.max(box[2], box[5])];
  const ew = face === "west" || face === "east";
  let n = 0;
  for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
    const quoin = ew ? z === lo[2] || z === hi[2] : x === lo[0] || x === hi[0];
    n += put(g, x, y, z, quoin ? "cut_sandstone" : stoneAt(x, y, z), undefined, opts);
  }
  return n;
}

/**
 * portal(x, z, w, h, face, { rings = 4, y0 }): a pointed doorway in the wall. (x, z) is the centre of the opening on the
 * wall (the face fixes which of the two is the wall's plane), w its width along the wall, h its height from the sill
 * y0 to the apex. Each archivolt ring is one block deeper than the one in front of it (cut_sandstone, the apex
 * courses upside-down smooth_sandstone_stairs). The splay is lined with a cut_sandstone lintel and a chiseled_sandstone
 * tympanum above it, with a sandstone_wall trumeau and two dark_oak_door leaves at the back. y0 is required.
 */
export function portal(g, x, z, w, h, face, { rings = 4, y0, over = false } = {}) {
  checkFace(face, "portal");
  if (y0 == null) throw new Error("portal: y0 (the sill's floor y) is required");
  const hw = Math.floor(w / 2);
  const springY = y0 + h - 1 - hw;                      // the pointed arch starts to narrow here
  const fr = frame(face, x, z);
  // Pointed outline grown by e cells: |u| <= hw + e - (rows above the springing), from the sill to the apex.
  const inside = (u, y, e) => y >= y0 && y <= y0 + h - 1 + e && Math.abs(u) <= hw + e - Math.max(0, y - springY - e);
  let n = 0;
  // Archivolt rings: ring r sits at depth rings - r (the outermost, widest ring is in the face plane).
  for (let r = 1; r <= rings; r++) {
    const d = rings - r;
    for (let u = -(hw + r); u <= hw + r; u++) for (let y = y0; y <= y0 + h - 1 + r; y++) {
      if (!inside(u, y, r) || inside(u, y, r - 1)) continue;
      const [bx, by, bz] = fr.cell(u, y, d);
      if (u !== 0 && y > springY + r) n += put(g, bx, by, bz, "smooth_sandstone_stairs", { facing: fr.toward(u), half: "top", shape: "straight", waterlogged: "false" }, { over });
      else n += put(g, bx, by, bz, "cut_sandstone", undefined, { over });
    }
  }
  // The void of the splay at each depth: the outline grown by rings - 1 - d, narrowing to the doorway at the back.
  for (let d = 0; d <= rings; d++) {
    const e = Math.max(0, rings - 1 - d);
    for (let u = -(hw + e); u <= hw + e; u++) for (let y = y0; y <= y0 + h - 1 + e; y++) {
      if (!inside(u, y, e)) continue;
      if (y === y0 + 2) n += put(g, ...fr.cell(u, y, d), "cut_sandstone", undefined, { over });
      else if (y >= y0 + 3) n += put(g, ...fr.cell(u, y, d), "chiseled_sandstone", undefined, { over });
    }
  }
  // Trumeau and the door leaves sit in the back of the splay (depth rings): the trumeau at u = 0, two leaves each side.
  const back = rings;
  for (let y = y0; y <= y0 + 1; y++) n += put(g, ...fr.cell(0, y, back), "sandstone_wall", { up: "true" }, { over });
  const leaf = Math.min(2, hw);
  for (let u = -leaf; u <= leaf; u++) {
    if (u === 0) continue;
    const hinge = u > 0 ? "left" : "right";
    const halves = [[y0, "lower"], [y0 + 1, "upper"]].map(([y, half]) => [...fr.cell(u, y, back), { facing: face, half, hinge, open: "false", powered: "false" }]);
    // Both halves or neither: a door never lands half in place.
    if (!over && halves.some(([bx, by, bz]) => !g.isAir(bx, by, bz))) continue;
    for (const [bx, by, bz, st] of halves) n += put(g, bx, by, bz, "dark_oak_door", st, { over });
  }
  return n;
}

/**
 * colonnade(line, y0, y1, step = 2): sandstone_wall colonnettes along line = [x0, z0, x1, z1] (a straight line along x
 * or z), one every `step` cells from its first end and including the last, from y0 up to y1. Each colonnette has an
 * upside-down smooth_sandstone_stairs head at y1 (its back faces `facing`, default south).
 */
export function colonnade(g, line, y0, y1, step = 2, { facing = "south", over = false } = {}) {
  const [x0, z0, x1, z1] = line;
  if (x0 !== x1 && z0 !== z1) throw new Error("colonnade: line must run straight along x or z");
  const alongX = x0 !== x1;
  const from = alongX ? x0 : z0, to = alongX ? x1 : z1;
  const dir = Math.sign(to - from) || 1;
  let n = 0;
  for (let p = from; dir * (p - to) <= 0; p += dir * step) {
    const x = alongX ? p : x0, z = alongX ? z0 : p;
    for (let y = y0; y < y1; y++) n += put(g, x, y, z, "sandstone_wall", { up: "true" }, { over });
    n += put(g, x, y1, z, "smooth_sandstone_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" }, { over });
  }
  return n;
}

/**
 * gargoyle(x, y, z, dir): a spout projecting two cells out from a wall. (x, y, z) is the first air cell in front of the
 * wall (a sandstone_wall post); the smooth_sandstone_stairs head sits one cell further out, facing `dir` (a face name).
 */
export function gargoyle(g, x, y, z, dir, { over = false } = {}) {
  checkFace(dir, "gargoyle");
  const [dx, , dz] = DIRS[dir];
  let n = put(g, x, y, z, "sandstone_wall", { up: "true" }, { over });
  n += put(g, x + dx, y, z + dz, "smooth_sandstone_stairs", { facing: OPPOSITE[dir], half: "bottom", shape: "straight", waterlogged: "false" }, { over });
  return n;
}

/**
 * ringWall(cx, cz, r0, r1, y0, y1, arc = [a0, a1], { bays, window, zClip = [4, 69] }): a polar wall round the centre
 * (cx, cz). A cell is in it when its rounded distance from the centre is r0..r1 and its angle (0 = due east, +x, in
 * degrees) lies in arc. bays: the arc is split into this many equal bays and each gets one window, centred in it,
 * window = { y0, y1, width = 3 } (left as air for the glazier: recessed by omission). Cells outside zClip are skipped.
 */
export function ringWall(g, cx, cz, r0, r1, y0, y1, arc = [-180, 180], { bays = 0, window = null, zClip = [4, 69], over = false } = {}) {
  const [a0, a1] = arc;
  const bayDeg = (a1 - a0) / Math.max(1, bays);
  const width = window?.width ?? 3;
  let n = 0;
  for (let x = cx - r1; x <= cx + r1; x++) for (let z = Math.max(cz - r1, zClip[0]); z <= Math.min(cz + r1, zClip[1]); z++) {
    const dx = x - cx, dz = z - cz, dist = Math.hypot(dx, dz);
    if (Math.round(dist) < r0 || Math.round(dist) > r1) continue;
    const ang = Math.atan2(dz, dx) * 180 / Math.PI;
    if (ang < a0 || ang > a1) continue;
    const bay = Math.min(Math.max(bays, 1) - 1, Math.floor((ang - a0) / bayDeg));
    const across = dist * (ang - (a0 + (bay + 0.5) * bayDeg)) * Math.PI / 180;   // cells off the bay's centre line
    for (let y = y0; y <= y1; y++) {
      const inWindow = window && bays > 0 && Math.abs(across) <= width / 2 && y >= window.y0 && y <= window.y1;
      if (!inWindow) n += put(g, x, y, z, stoneAt(x, y, z), undefined, { over });
    }
  }
  return n;
}

/**
 * statue(x, y, z, facing = "south"): an apostle standing on a ridge, (x, y, z) its feet: an oxidized_cut_copper body
 * with an oxidized_cut_copper_stairs head above it, the head facing `facing`.
 */
export function statue(g, x, y, z, facing = "south", { over = false } = {}) {
  checkFace(facing, "statue");
  let n = put(g, x, y, z, "oxidized_cut_copper", undefined, { over });
  n += put(g, x, y + 1, z, "oxidized_cut_copper_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" }, { over });
  return n;
}

/**
 * lampPost(x, y, z): a lamp on three sandstone_wall posts (from y up), the lantern standing on top at y + 3. One column:
 * the cells beside it stay clear.
 */
export function lampPost(g, x, y, z, { over = false } = {}) {
  let n = 0;
  for (let k = 0; k < 3; k++) n += put(g, x, y + k, z, "sandstone_wall", { up: "true" }, { over });
  n += put(g, x, y + 3, z, "lantern", { hanging: "false", waterlogged: "false" }, { over });
  return n;
}
