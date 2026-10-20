// Named helpers from plan.md's VOCABULARY, group h2: the brick wall, the round arch opening, the striped awning, the
// skylight gable, the lantern bracket, the produce crate, the stair house, the shop front and the garden pot.
//
// Every helper takes the grid first, then its position (and facing where it has one), and returns
// { box, placed, refused }: its footprint box (inclusive corners), how many cells it wrote, and any write it left out.
// Writes stay inside the footprint, go only into air, and never reach y 0: ground, sand and floors belong to earlier
// parts. archOpening is the one exception to "only into air": it cuts the wall cells inside its own opening.
// States are written as plain objects with the properties `$MCD states` lists for 1.21.1.
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const lo = (a, b) => Math.min(a, b);
const hi = (a, b) => Math.max(a, b);
const onWallX = (f) => f === "east" || f === "west";           // the wall plane is x = const; it runs along z
const AIR = ["air", "minecraft:air"];
const inBox = ([a0, b0, c0, a1, b1, c1], x, y, z) => x >= a0 && x <= a1 && y >= b0 && y <= b1 && z >= c0 && z <= c1;
// A block that can stand a pot: a full cube, not a slab, stair, wall, fence, pane, plant or other thin thing.
const NOT_FULL = /slab|stair|wall|fence|trapdoor|door|pane|carpet|banner|sign|bars|chain|lantern|torch|pot|fern|tulip|azalea|flower|leaves|ladder|rail|bed/;
const fullBlock = (name) => !AIR.includes(name) && !NOT_FULL.test(name);

function checkFace(f, name) {
  if (!DIRS[f]) throw new Error(`${name}: unknown face ${f}`);
}

/** A footprint box from two corners; put() writes only into air inside it (over solids too when `over`), at y >= 1. */
function footprint(g, a, b, { over = false } = {}) {
  const [x0, y0, z0] = [lo(a[0], b[0]), lo(a[1], b[1]), lo(a[2], b[2])];
  const [x1, y1, z1] = [hi(a[0], b[0]), hi(a[1], b[1]), hi(a[2], b[2])];
  const w = { box: [[x0, y0, z0], [x1, y1, z1]], placed: 0, refused: [] };
  w.put = (x, y, z, block, state) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1 && y >= 1 && g.inBounds(x, y, z);
    const blank = AIR.includes(block);
    if (inside && blank && g.isAir(x, y, z)) return;                    // carving air into air: nothing to do
    if (inside && (over || g.isAir(x, y, z))) { g.set(x, y, z, block, state); w.placed++; }
    else w.refused.push([x, y, z, block]);
  };
  return w;
}
const done = (fp) => ({ box: fp.box, placed: fp.placed, refused: fp.refused });

/** Cell on a wall plane: e is the coordinate across the wall (x for east/west faces, z for north/south), r along it. */
const wallCell = (f, e, r, y) => (onWallX(f) ? [e, y, r] : [r, y, e]);

/**
 * A 1-block brick shell around the box x0..x1, z0..z1, y0..y1 (the face side is 2 thick when bluff). Granite 1 in 12
 * below stringY when granite is set. keepAir: boxes [x0,y0,z0,x1,y1,z1] of windows and openings left air.
 */
export function brickWall(g, { x0, x1, z0, z1, y0, y1, face: f, bluff = false, granite = false, stringY = null, keepAir = [] }) {
  checkFace(f, "brickWall");
  const t = { east: 1, west: 1, north: 1, south: 1 };
  t[f] = bluff ? 2 : 1;
  const fp = footprint(g, [x0, y0, z0], [x1, y1, z1]);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x - x0 < t.west || x1 - x < t.east || z - z0 < t.north || z1 - z < t.south;
    if (!edge || keepAir.some((b) => inBox(b, x, y, z))) continue;
    const grit = granite && stringY !== null && y < stringY && (5 * x + 7 * y + 3 * z) % 12 === 0;
    fp.put(x, y, z, grit ? "granite" : "bricks");
  }
  return done(fp);
}

// Rise of the arch above spring for the six columns u = -3..2 (impost, course, keystone pair, course, impost).
const ARCH_RISE = [0, 1, 2, 2, 1, 0];

/**
 * A 6-wide round arch cut through the wall plane at `center` = [x, y0, z]: y0 is the first air row (the floor is below
 * it, never touched), the centre cell is the first cell of the right half (u = 0), and the crown is spring + 2.
 * Imposts smooth_sandstone at spring; stairs (`${stairs}_stairs`, top half) on the curve, rising toward the centre;
 * keystone on the two crown cells. depth: cells through the wall, from the wall's outer face inwards.
 */
export function archOpening(g, { center: [cx, y0, cz], face: f, span = 6, spring, crown, keystone = "chiseled_sandstone", stairs = "brick", depth = 1 }) {
  checkFace(f, "archOpening");
  if (span !== 6 || crown - spring !== 2) throw new Error("archOpening: only the 6-wide round arch with crown = spring + 2 is built");
  const out = DIRS[f];
  const inward = [-out[0], 0, -out[2]];
  const h = onWallX(f) ? [0, 0, 1] : [1, 0, 0];
  const at = (u, k, y) => [cx + u * h[0] + k * inward[0], y, cz + u * h[2] + k * inward[2]];
  const toward = onWallX(f) ? "south" : "east";                       // +h: into the centre from the left half
  const fp = footprint(g, at(-3, 0, y0), at(2, depth - 1, crown), { over: true });
  for (let u = -3; u <= 2; u++) {
    const i = u + 3, top = spring + ARCH_RISE[i];
    for (let k = 0; k < depth; k++) {
      for (let y = y0; y < top; y++) fp.put(...at(u, k, y), "air");
      if (i === 0 || i === 5) fp.put(...at(u, k, top), "smooth_sandstone");
      else if (i === 1 || i === 4) fp.put(...at(u, k, top), `${stairs}_stairs`, { facing: i === 1 ? toward : OPPOSITE[toward], half: "top", shape: "straight" });
      else fp.put(...at(u, k, top), keystone);
    }
  }
  return done(fp);
}

/**
 * Two courses of 1-wide wool stripes along a footprint edge, with an open spruce trapdoor valance under the outer course.
 * from/to = [x, z] at the edge (they share the edge coordinate); the run goes from `from` to `to` along the wall.
 * Back course at edge+1 (outward) and y; front course at the edge and y-1.
 */
export function stripedAwning(g, { from, to, face: f, y, colours = ["red", "white"] }) {
  checkFace(f, "stripedAwning");
  const across = onWallX(f) ? 0 : 1;
  if (from[across] !== to[across]) throw new Error("stripedAwning: from and to must lie on the same footprint edge");
  const edge = from[across], o = onWallX(f) ? DIRS[f][0] : DIRS[f][2];
  const r0 = lo(from[1 - across], to[1 - across]), r1 = hi(from[1 - across], to[1 - across]);
  const fp = footprint(g, wallCell(f, edge, r0, y - 1), wallCell(f, edge + o, r1, y));
  for (let r = r0; r <= r1; r++) {
    const wool = `${colours[(r - r0) % colours.length]}_wool`;
    fp.put(...wallCell(f, edge + o, r, y), wool);
    fp.put(...wallCell(f, edge, r, y - 1), wool);
    fp.put(...wallCell(f, edge + o, r, y - 1), "spruce_trapdoor", { facing: OPPOSITE[f], half: "top", open: "true" });
  }
  return done(fp);
}

/**
 * The gable skylight: at each course y0..y0+K, glass rings at the two slope edges (z = z0+k and z1-k), white panes on the
 * gable triangles at x0 and x1, white concrete ribs every `ribEvery` from x0 along the slopes, interior air. The slopes
 * meet at ridgeZ on the top course (y0 + K). A shroomlight row sits at lightY over z = lightZ, under the middle.
 */
export function skylightGable(g, { x0 = 23, x1 = 41, z0 = 19, z1 = 31, y0 = 36, ridgeZ = 25, ribEvery = 4, lightY = 34, lightZ = [21, 29] } = {}) {
  const K = ridgeZ - z0;
  if (z1 - K !== ridgeZ) throw new Error("skylightGable: the two slopes must meet at ridgeZ");
  const fp = footprint(g, [x0, lightY, z0], [x1, y0 + K, z1]);
  for (let k = 0; k <= K; k++) {
    const y = y0 + k, zLo = z0 + k, zHi = z1 - k;
    for (let x = x0; x <= x1; x++) for (let z = zLo; z <= zHi; z++) {
      if (x === x0 || x === x1) fp.put(x, y, z, "white_stained_glass_pane");
      else if ((x - x0) % ribEvery === 0) fp.put(x, y, z, "white_concrete");
      else if (z === zLo || z === zHi) fp.put(x, y, z, "glass");
    }
  }
  const lightX = Math.round((x0 + x1) / 2);
  for (let z = lightZ[0]; z <= lightZ[1]; z++) fp.put(lightX, lightY, z, "shroomlight");
  return done(fp);
}

/** A lantern on a spruce fence arm, one cell out from the pier at `at` (the pier cell), hanging under the arm's end. */
export function lanternBracket(g, { at: [x, y, z], face: f }) {
  checkFace(f, "lanternBracket");
  const out = DIRS[f], ax = x + out[0], az = z + out[2];
  const fp = footprint(g, [ax, y - 1, az], [ax, y, az]);
  fp.put(ax, y, az, "spruce_fence", { [OPPOSITE[f]]: "true" });       // the arm joins the pier on its inward side
  fp.put(ax, y - 1, az, "lantern", { hanging: "true" });              // hangs from the arm above it
  return done(fp);
}

const PRODUCE = ["melon", "pumpkin", "hay_block"];
const POTS = ["potted_fern", "flower_pot"];

/**
 * A row of barrels (facing up) from `at` along the axis, with produce on each barrel (melon, pumpkin, hay alternating;
 * kind "pots" puts potted plants and flower pots instead). Two high at most.
 */
export function produceCrate(g, { at: [x, y, z], kind = "produce", length = 3, axis = "x" }) {
  const s = axis === "z" ? [0, 0, 1] : [1, 0, 0];
  const cell = (i, yy) => [x + i * s[0], yy, z + i * s[2]];
  const fp = footprint(g, cell(0, y), cell(length - 1, y + 1));
  for (let i = 0; i < length; i++) {
    fp.put(...cell(i, y), "barrel", { facing: "up" });
    fp.put(...cell(i, y + 1), kind === "pots" ? POTS[i % POTS.length] : PRODUCE[i % PRODUCE.length]);
  }
  return done(fp);
}

/**
 * A hollow brick box (the floor and roof rings included) with a 1-wide, 2-high air door in its z0 face at the middle of
 * x, and a stone brick slab lid at y 38 overhanging the box by one cell.
 */
export function stairHouse(g, { box: [x0, y0, z0, x1, y1, z1] }) {
  const fp = footprint(g, [x0 - 1, y0, z0 - 1], [x1 + 1, 38, z1 + 1]);
  const door = Math.floor((x0 + x1) / 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1 || y === y0 || y === y1;
    if (!ring || (z === z0 && x === door && y <= y0 + 1)) continue;
    fp.put(x, y, z, "bricks");
  }
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) fp.put(x, 38, z, "stone_brick_slab", { type: "bottom" });
  return done(fp);
}

/**
 * A shop front on the wall plane of `face`, `w` cells long from `at` = [x, y0, z] (the run goes +z or +x from it):
 * spruce planks at y0+1, glass panes y0+2..y0+5, stone brick slab lintel at y0+6, spruce planks fascia at y0+7.
 * door: a spruce door (both halves, facing out) at the middle cell, its glass above it.
 */
export function shopFront(g, { at: [x, y0, z], face: f, w = 10, door = true }) {
  checkFace(f, "shopFront");
  const plane = onWallX(f) ? x : z, r0 = onWallX(f) ? z : x;
  const cell = (i, yy) => wallCell(f, plane, r0 + i, yy);
  const runPanes = onWallX(f) ? { north: "true", south: "true" } : { east: "true", west: "true" };
  const di = Math.floor(w / 2);
  const fp = footprint(g, cell(0, y0 + 1), cell(w - 1, y0 + 7));
  for (let i = 0; i < w; i++) {
    const isDoor = door && i === di;
    if (isDoor) {
      fp.put(...cell(i, y0 + 1), "spruce_door", { facing: f, half: "lower", hinge: "left", open: "false" });
      fp.put(...cell(i, y0 + 2), "spruce_door", { facing: f, half: "upper", hinge: "left", open: "false" });
    } else fp.put(...cell(i, y0 + 1), "spruce_planks");
    for (let yy = y0 + 2; yy <= y0 + 5; yy++) if (!(isDoor && yy === y0 + 2)) fp.put(...cell(i, yy), "glass_pane", runPanes);
    fp.put(...cell(i, y0 + 6), "stone_brick_slab", { type: "bottom" });
    fp.put(...cell(i, y0 + 7), "spruce_planks");
  }
  return done(fp);
}

/**
 * A garden pot at `at` (potted_fern or potted_azalea_bush) standing on a full block below it; refused when the cell below
 * is not a full block. box: a window box instead, a spruce trapdoor (open, facing the wall) with the plant above it.
 */
export function gardenPot(g, { at: [x, y, z], plant = "potted_fern", box = false, face: f = "north" }) {
  if (!["potted_fern", "potted_azalea_bush"].includes(plant)) throw new Error(`gardenPot: unknown plant ${plant}`);
  if (box) {
    checkFace(f, "gardenPot");
    const fp = footprint(g, [x, y, z], [x, y + 1, z]);
    fp.put(x, y, z, "spruce_trapdoor", { facing: OPPOSITE[f], half: "bottom", open: "true" });
    fp.put(x, y + 1, z, plant);
    return done(fp);
  }
  const fp = footprint(g, [x, y, z], [x, y, z]);
  if (!fullBlock(g.blockAt(x, y - 1, z))) fp.refused.push([x, y, z, plant]);
  else fp.put(x, y, z, plant);
  return done(fp);
}
