// Named helpers from plan.md's VOCABULARY, group h2: ashlar walls, the polar (apse) walls, one flank bay, the ridge
// crest, the clerestory corbel table, the wall buttress, the wimperg, an octagon course, lancet glazing, the paving strip.
//
// Every helper takes the grid first, then its position (and facing where it has one), and returns
// { box, placed, refused }: its footprint box (inclusive corners), how many cells it wrote, and any write it left out.
// Writes stay inside the footprint and go only into air (an earlier part owns every other cell). paveStrip is the one
// exception: the strip IS the ground's surface course, so it replaces that cell (natural ground only).
// Faces are "north"/"south"/"east"/"west" = the way the wall looks out. Stairs: facing = the back (high) side.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const C = [152, 38];                                            // the apse centre (plan: C = (152, 38))
const mirrorN = (z) => 76 - z;
const flipZ = (f) => (f === "north" ? "south" : f === "south" ? "north" : f);
const lo = Math.min, hi = Math.max;

/** Deterministic hash in [0, 1) of a cell (no randomness: rebuilds are byte-identical). */
const hash = (x, y, z, s = 0) => {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ Math.imul(s, 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** A footprint box from two corners; put() writes only into air inside it and records what it refused. */
function footprint(g, a, b) {
  const box = [[lo(a[0], b[0]), lo(a[1], b[1]), lo(a[2], b[2])], [hi(a[0], b[0]), hi(a[1], b[1]), hi(a[2], b[2])]];
  const w = { box, placed: 0, refused: [] };
  w.inside = (x, y, z) => x >= box[0][0] && x <= box[1][0] && y >= box[0][1] && y <= box[1][1] && z >= box[0][2] && z <= box[1][2];
  w.put = (x, y, z, block, state, { overwrite } = {}) => {
    const ok = w.inside(x, y, z) && g.inBounds(x, y, z) && (g.isAir(x, y, z) || (overwrite && overwrite(g.blockAt(x, y, z))));
    if (ok) { g.set(x, y, z, block, state); w.placed++; } else w.refused.push([x, y, z, block]);
    return ok;
  };
  return w;
}
const report = (w) => ({ box: w.box, placed: w.placed, refused: w.refused });
const boxOf = (b) => (Array.isArray(b) ? b : [[b.x0, b.y0, b.z0], [b.x1, b.y1, b.z1]]);
/** A list of cells [x,y,z] and/or boxes [[x0,y0,z0],[x1,y1,z1]] as a membership test. */
function cellTest(list = []) {
  const cells = new Set(), boxes = [];
  for (const e of list) if (Array.isArray(e[0])) boxes.push(boxOf(e)); else cells.add(e.join(","));
  return (x, y, z) => cells.has(`${x},${y},${z}`) || boxes.some(([[a, b, c], [d, e, f]]) =>
    x >= lo(a, d) && x <= hi(a, d) && y >= lo(b, e) && y <= hi(b, e) && z >= lo(c, f) && z <= hi(c, f));
}

const stairs = (facing, half = "bottom") => B.stairs("smooth_sandstone", facing, half);
const slabTop = (mat) => B.slab(mat, "top");
const lone = (block) => [block, { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" }];
const ashlar = (x, y, z) => (y < 12 && hash(x, y, z, 1) < 0.1 ? "sandstone" : "smooth_sandstone");

/** 2. Solid smooth_sandstone wall; below y 12 every ~10th cell sandstone; the corner columns as quoins (cut_sandstone
 *  every other course). face (optional) keeps the quoins to the corners on that face. openings: cells/boxes left air. */
export function ashlarWall(g, box, { face, openings = [] } = {}) {
  const [[x0, y0, z0], [x1, y1, z1]] = boxOf(box).map((c, i, a) => c.map((_, k) => (i ? hi : lo)(a[0][k], a[1][k])));
  const w = footprint(g, [x0, y0, z0], [x1, y1, z1]), open = cellTest(openings);
  const onFace = (x, z) => !face || (face === "north" ? z === z0 : face === "south" ? z === z1 : face === "west" ? x === x0 : x === x1);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1) && onFace(x, z);
    for (let y = y0; y <= y1; y++) {
      if (open(x, y, z)) continue;                              // recess by exclusion
      w.put(x, y, z, corner && (y - y0) % 2 === 0 ? "cut_sandstone" : ashlar(x, y, z));
    }
  }
  return report(w);
}

/** Angle (degrees) of a cell about C: 0 = east (+x), +90 = south (+z), -90 = north. */
const angleOf = (x, z, c = C) => (Math.atan2(z - c[1], x - c[0]) * 180) / Math.PI;

/** 6. Every cell with distance from C in [r0, r1] and angle in [a0, a1], x >= C.x, from y0 to y1, in `block`
 *  (default smooth_sandstone); `open` cells/boxes are left air. */
export function polarWall(g, { r0, r1, a0 = -90, a1 = 90, y0, y1, block = "smooth_sandstone", open = [], c = C }) {
  const R = Math.ceil(r1), w = footprint(g, [c[0], y0, c[1] - R], [c[0] + R, y1, c[1] + R]), skip = cellTest(open);
  for (let x = c[0]; x <= c[0] + R; x++) for (let z = c[1] - R; z <= c[1] + R; z++) {
    const r = Math.hypot(x - c[0], z - c[1]), a = angleOf(x, z, c);
    if (r < r0 || r > r1 || a < a0 || a > a1) continue;
    for (let y = y0; y <= y1; y++) if (!skip(x, y, z)) w.put(x, y, z, ...(Array.isArray(block) ? block : [block]));
  }
  return report(w);
}

/** A pointed lancet left as air in a wall (x along the wall, outer face zo, glass plane zg): cut_sandstone jambs on
 *  the outer face, smooth_sandstone_slab (top) sill under it, and for w >= 3 the top two rows narrowing 1 a side under
 *  upside-down stairs (their slope looking into the opening, back against the jamb); w = 1: one upside-down stair cap.
 *  Returns the set of cells the wall must leave out (the opening, its jambs/sill/head are written here). */
function lancetIn(w, { xa, xb, y0, y1, zo, zg }) {
  const keep = new Set(), k = (x, y, z) => keep.add(`${x},${y},${z}`);
  const width = xb - xa + 1;
  for (let x = xa; x <= xb; x++) for (let y = y0; y <= y1; y++) { k(x, y, zo); k(x, y, zg); }
  for (let y = y0; y <= y1; y++) { w.put(xa - 1, y, zo, "cut_sandstone"); w.put(xb + 1, y, zo, "cut_sandstone"); k(xa - 1, y, zo); k(xb + 1, y, zo); }
  for (let x = xa; x <= xb; x++) { w.put(x, y0 - 1, zo, ...slabTop("smooth_sandstone")); k(x, y0 - 1, zo); }
  if (width === 1) w.put(xa, y1, zo, ...stairs("east", "top"));    // a lone cap: the plan's single upside-down stair
  else if (width >= 3) {
    for (let row = 0; row < 2; row++) {
      const y = y1 - 1 + row, l = xa + row, r = xb - row;
      w.put(l, y, zo, ...stairs("west", "top"));
      w.put(r, y, zo, ...stairs("east", "top"));
    }
  }
  return keep;
}

/** 10. One bay of the flank shell between pier p and p+8 (cells x p..p+7), side "S" or "N" (N = mirror z' = 76 - z):
 *  outer aisle wall z 65..66 y 3..18 with the chapel lancet x p+3..p+6 y 6..17 (glass plane z 65); tribune wall
 *  z 58..59 y 21..31 with two 1x3 lancets at x p+3 and p+6 y 26..28 (plane z 58); clerestory wall z 48..49 y 3..47 with a
 *  4x8 lancet x p+3..p+6 y 38..45 (plane z 48); tribune floor y 20 z 50..57. Interior otherwise air. */
export function flankBay(g, { p, side = "S" }) {
  const Z = side === "N" ? mirrorN : (z) => z;
  const w0 = footprint(g, [p, 3, Z(48)], [p + 7, 47, Z(66)]);
  // Write in south coordinates; the mirror maps z and flips north/south facings.
  const w = { ...w0, put: (x, y, z, block, state) => w0.put(x, y, Z(z), block, side === "N" && state?.facing ? { ...state, facing: flipZ(state.facing) } : state) };
  const walls = [
    { z: [65, 66], y: [3, 18], win: { xa: p + 3, xb: p + 6, y0: 6, y1: 17, zo: 66, zg: 65 } },
    { z: [58, 59], y: [21, 31], wins: [{ xa: p + 3, xb: p + 3, y0: 26, y1: 28, zo: 59, zg: 58 }, { xa: p + 6, xb: p + 6, y0: 26, y1: 28, zo: 59, zg: 58 }] },
    { z: [48, 49], y: [3, 47], win: { xa: p + 3, xb: p + 6, y0: 38, y1: 45, zo: 49, zg: 48 } },
  ];
  for (const wall of walls) {
    const keep = new Set();
    for (const win of wall.wins ?? [wall.win]) for (const c of lancetIn(w, win)) keep.add(c);
    for (let x = p; x <= p + 7; x++) for (let z = wall.z[0]; z <= wall.z[1]; z++) for (let y = wall.y[0]; y <= wall.y[1]; y++)
      if (!keep.has(`${x},${y},${z}`)) w.put(x, y, z, ashlar(x, y, Z(z)));
  }
  for (let x = p; x <= p + 7; x++) for (let z = 50; z <= 57; z++) w.put(x, 20, z, "smooth_sandstone");
  return report(w0);
}

/** 14. iron_bars every other cell along a ridge line, on top of the ridge slab: x0..x1 at z (or z0..z1 at x). */
export function ridgeCrest(g, { x0, x1, z, y, z0, z1, x }) {
  const alongZ = z0 != null;
  const w = alongZ ? footprint(g, [x, y, z0], [x, y, z1]) : footprint(g, [x0, y, z], [x1, y, z]);
  const [a, b] = alongZ ? [lo(z0, z1), hi(z0, z1)] : [lo(x0, x1), hi(x0, x1)];
  for (let u = a; u <= b; u += 2) w.put(alongZ ? x : u, y, alongZ ? u : z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  return report(w);
}

/** 18. Corbel table on the wall-face cells [x, z] (or [x, z, face] for a turning run such as the apse), 1 proud:
 *  at y upside-down smooth_sandstone_stairs facing the wall, every other cell a cut_sandstone corbel; at y+1 the
 *  cornice cut_sandstone_slab (top), 1 proud. */
export function corbelTable(g, { cells, y = 46, face }) {
  const out = cells.map(([x, z, f = face], i) => [x + OUT[f][0], z + OUT[f][1], f, i]);
  const xs = out.map((c) => c[0]), zs = out.map((c) => c[1]);
  const w = footprint(g, [lo(...xs), y, lo(...zs)], [hi(...xs), y + 1, hi(...zs)]);
  for (const [x, z, f, i] of out) {
    if (i % 2 === 1) w.put(x, y, z, "cut_sandstone"); else w.put(x, y, z, ...stairs(OUT_INV(f), "top"));
    w.put(x, y + 1, z, ...slabTop("cut_sandstone"));
  }
  return report(w);
}
const OUT_INV = (f) => ({ north: "south", south: "north", east: "west", west: "east" })[f];

/** 22. A 2-wide strip 1 proud on the clerestory wall: (x, z) is its first proud cell (z 50 S / z 26 N); it runs 2
 *  along the wall (x..x+1 for a north/south face, z..z+1 for east/west), smooth_sandstone y0..y1-1, cut_sandstone top. */
export function wallButtress(g, { x, z, y0 = 37, y1 = 47, face }) {
  const [dx, dz] = face === "north" || face === "south" ? [1, 0] : [0, 1];
  const w = footprint(g, [x, y0, z], [x + dx, y1, z + dz]);
  for (let i = 0; i < 2; i++) for (let y = y0; y <= y1; y++) w.put(x + i * dx, y, z + i * dz, y === y1 ? "cut_sandstone" : "smooth_sandstone");
  return report(w);
}

/** 26. A steep open gable in front of a window/portal, standing 1 proud of the wall: centre = [x, z] on the wall's
 *  outer face, w wide (odd), from yBase (the jamb tops) to the apex at yApex. Rakes of smooth_sandstone_stairs
 *  (bottom, facing in) step inward up to the apex, a sandstone_wall crocket stub on every 2nd rake step, apex
 *  chiseled_sandstone + end_stone_brick_wall; the triangle between the rakes stays open. */
export function wimperg(g, { centre, face, w: width, yBase, yApex }) {
  const [cx, cz] = [centre[0] + OUT[face][0], centre[centre.length - 1] + OUT[face][1]];
  const along = face === "north" || face === "south" ? [1, 0] : [0, 1];
  const at = (u, y) => [cx + u * along[0], y, cz + u * along[1]];
  const half = Math.floor(width / 2), rise = hi(1, yApex - yBase);
  const w = footprint(g, at(-half, yBase), at(half, yApex + 1));
  const inward = (s) => (along[0] ? (s < 0 ? "east" : "west") : (s < 0 ? "south" : "north"));
  const rakeU = (y) => half - Math.floor(((y - yBase) * half) / rise);   // |u| of the rake at height y
  let step = 0;
  for (let y = yBase; y < yApex; y++) {
    const u = rakeU(y), top = rakeU(y + 1) !== u;              // the last row of this column is the stair step
    for (const s of u === 0 ? [] : [-1, 1]) {
      if (top) w.put(...at(s * u, y), ...stairs(inward(s)));
      else w.put(...at(s * u, y), "smooth_sandstone");
    }
    if (top && u > 0) { if (step % 2 === 1) for (const s of [-1, 1]) w.put(...at(s * u, y + 1), ...lone("sandstone_wall")); step++; }
  }
  w.put(...at(0, yApex), "chiseled_sandstone");
  w.put(...at(0, yApex + 1), ...lone("end_stone_brick_wall"));
  return report(w);
}

/** 30. One course of an octagon w wide about (cx, cz) (a .5 centre for an even width), corners cut `cut`;
 *  hollow keeps the 1-thick (watertight) ring. block: an id or [id, state]. */
export function octagonRing(g, { cx = 94, cz = 38, y, w: width, cut = Math.round(width / 3), block = "smooth_sandstone", hollow = true }) {
  const x0 = Math.ceil(cx - (width - 1) / 2 - 1e-9), z0 = Math.ceil(cz - (width - 1) / 2 - 1e-9);
  const mx = x0 + (width - 1) / 2, mz = z0 + (width - 1) / 2, half = (width - 1) / 2;
  const inShape = (x, z) => Math.abs(x - mx) <= half + 1e-9 && Math.abs(z - mz) <= half + 1e-9 && Math.abs(x - mx) + Math.abs(z - mz) <= 2 * half - cut + 1e-9;
  const w = footprint(g, [x0, y, z0], [x0 + width - 1, y, z0 + width - 1]);
  for (let x = x0; x < x0 + width; x++) for (let z = z0; z < z0 + width; z++) {
    if (!inShape(x, z)) continue;
    const edge = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].some(([a, b]) => !inShape(x + a, z + b));
    if (!hollow || edge) w.put(x, y, z, ...(Array.isArray(block) ? block : [block]));
  }
  return report(w);
}

const FULLISH = (b) => !/air$|_stairs$|_slab$|_wall$|_fence|_door$|_trapdoor$|lantern|torch|_rod$|_sign$|banner|carpet/.test(b);
const PANE_DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
/** 34. Fill an opening's glass plane with panes: cells [x, y, z], or [a, y] with plane { z: n } (a = x) or { x: n }
 *  (a = z). By hash 60% blue, 20% purple, 20% red; the top row of each column always purple. Each pane connects to
 *  the panes beside it and to full blocks / glass (no thin posts). */
export function glazeLancet(g, { cells, plane = {} }) {
  const pts = cells.map((c) => (c.length === 3 ? c : plane.z != null ? [c[0], c[1], plane.z] : [plane.x, c[1], c[0]]));
  const set = new Set(pts.map((p) => p.join(","))), topOf = new Map();
  for (const [x, y, z] of pts) topOf.set(`${x},${z}`, hi(topOf.get(`${x},${z}`) ?? -Infinity, y));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), zs = pts.map((p) => p[2]);
  const w = footprint(g, [lo(...xs), lo(...ys), lo(...zs)], [hi(...xs), hi(...ys), hi(...zs)]);
  for (const [x, y, z] of pts) {
    const r = hash(x, y, z, 7);
    const colour = y === topOf.get(`${x},${z}`) ? "purple" : r < 0.6 ? "blue" : r < 0.8 ? "purple" : "red";
    const st = { waterlogged: "false" };
    for (const [d, [dx, dz]] of Object.entries(PANE_DIRS)) {
      const nx = x + dx, nz = z + dz, nb = g.inBounds(nx, y, nz) ? g.blockAt(nx, y, nz) : "minecraft:air";
      st[d] = String(set.has(`${nx},${y},${nz}`) || /glass|iron_bars/.test(nb) || FULLISH(nb));
    }
    w.put(x, y, z, `${colour}_stained_glass_pane`, st);
  }
  return report(w);
}

const GROUND = /(grass_block|dirt|podzol|mycelium|sand$|red_sand|gravel|^minecraft:stone$|smooth_stone$|cobblestone$|andesite$|diorite$|granite$|tuff$|mud$|clay$|moss_block|calcite|deepslate$|dirt_path)$/;
/** 38. smooth_stone paving 1 wide along the walls: cells [x, z] (the surface found as the top of the ground, the
 *  first solid run from the bottom) or [x, y, z]. All full blocks, no slabs on the walk line. The strip replaces the
 *  ground's surface cell (natural ground only: never plinth, wall or a floodlight). */
export function paveStrip(g, { cells }) {
  const pts = cells.map((c) => {
    if (c.length === 3) return c;
    let y = 0;
    while (g.inBounds(c[0], y + 1, c[1]) && !g.isAir(c[0], y + 1, c[1]) && GROUND.test(g.blockAt(c[0], y + 1, c[1]))) y++;
    return [c[0], y, c[1]];
  });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), zs = pts.map((p) => p[2]);
  const w = footprint(g, [lo(...xs), lo(...ys), lo(...zs)], [hi(...xs), hi(...ys), hi(...zs)]);
  for (const [x, y, z] of pts) w.put(x, y, z, "smooth_stone", undefined, { overwrite: (b) => GROUND.test(b) && b !== "minecraft:smooth_stone" });
  return report(w);
}
