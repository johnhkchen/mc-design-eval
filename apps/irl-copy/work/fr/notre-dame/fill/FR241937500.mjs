// FR241937500: a stone residence of 1763 on the Île de la Cité, seven storeys to a mansard on its tallest tier, with flat-topped
// wings stepping down to three and four storeys where the lidar drops. Cream limestone walls (smooth sandstone) on a dark stone
// base, a band course at every storey line, a cornice over each top, glazed windows in stone surrounds on the exposed faces
// (an air gap behind each pane, the odd glowstone lit behind it), a stone doorway on the south front, and brick chimneys on the
// flat roofs. Every column is solid from y 0 to its top, so nothing floats; y 2 is the base course and storeys run every 5 blocks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const CELLS = `${DIR}/FR241937500.cells.json`;
const OUT = `${DIR}/FR241937500.nbt`;

const W = 13, H = 52, D = 36;
const BASE = 2, STOREY = 5, MANSARD_TIER = 37;
const WALL = "smooth_sandstone", BAND = "stone_bricks", ROOF = "deepslate_tiles", CHIMNEY = "bricks", GLOW = "glowstone";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];       // east, west, south, north (dx, dz)
const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roofAt = new Map(), groundAt = new Map();
for (const [x, z, g, r] of cells) { roofAt.set(key(x, z), r); groundAt.set(key(x, z), g); }
const inFp = (x, z) => roofAt.has(key(x, z));

// Lidar roof: the median of each cell's 5 x 5 footprint neighbourhood (drops the stray low cells and the jaggies), then snapped to a storey line.
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tierOf = (r) => Math.min(MANSARD_TIER, Math.max(BASE + STOREY, BASE + STOREY * Math.round((r - BASE) / STOREY)));
const top = new Map();
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number), around = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inFp(x + dx, z + dz)) around.push(roofAt.get(key(x + dx, z + dz)));
  top.set(k, tierOf(median(around)));
}
const topAt = (x, z) => top.get(key(x, z));

// Distance in from the outside edge (1 on the perimeter): the mansard and the carved window pockets use it.
const dist = new Map(), queue = [];
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (inFp(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const distAt = (x, z) => dist.get(key(x, z)) ?? 0;

// The occupancy: a map of "x,y,z" to { b, s, glass } so panes can read their neighbours before the volume is written.
const occ = new Map();
const put = (x, y, z, b, s, extra) => occ.set(k3(x, y, z), { b, s, ...extra });
const del = (x, y, z) => occ.delete(k3(x, y, z));
const solidAt = (x, y, z) => occ.has(k3(x, y, z));

// A face is exposed at a row where the neighbour is outside the footprint or its column has already ended below.
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);
// Bays along a face: a pier, two glazed, a pier, two glazed (x for the north and south fronts, z for the east and west ends).
const bay = (x, z, [dx]) => { const i = dx ? z : x; return [1, 2].includes(((i % 4) + 4) % 4); };

// 1. Columns: foundation to the cell's ground, the base course, the storey bands, glazing and stone surrounds, the cornice.
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number), T = topAt(x, z), g = groundAt.get(k);
  for (let y = 0; y < T; y++) {
    if (y < g || y < BASE || y === T - 1) { put(x, y, z, BAND, null); continue; }   // plinth, base course, cornice
    const r = (y - BASE) % STOREY;
    if (r === 0) { put(x, y, z, BAND, null); continue; }                              // storey band (floor line)
    if (r === 4) {                                                                    // lintel over the glazing
      const face = exposedDirs(x, y, z).find((d) => bay(x, z, d));
      put(x, y, z, face ? BAND : WALL, null);
      continue;
    }
    const face = exposedDirs(x, y, z).find((d) => bay(x, z, d));
    if (face) put(x, y, z, "glass_pane", { waterlogged: "false" }, { glass: true, out: face, row: r });
    else put(x, y, z, WALL, null);
  }
}

// 2. The mansard on the tallest tier: three steps of slate, each inset one more cell than the last, standing on the cornice ring.
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (topAt(x, z) !== MANSARD_TIER) continue;
  const d = distAt(x, z), T = MANSARD_TIER;
  for (let j = 0; j < 3; j++) if (d >= 2 + j) put(x, T + j, z, ROOF, null);
}

// 3. Roof equipment: brick chimney stacks on the flat tiers, standing on their cornice.
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number), T = topAt(x, z);
  if (T === MANSARD_TIER || distAt(x, z) < 2) continue;
  if (x % 5 === 3 && z % 7 === 4) for (let j = 0; j < 3; j++) put(x, T + j, z, CHIMNEY, null);
}

// 4. The south doorway: a stone surround with a pair of doors in the bottom storey, the door's hall behind it open.
const DOOR_X = 6, DOOR_Z = 35;
for (let y = 0; y <= 4; y++) { put(DOOR_X - 1, y, DOOR_Z, BAND, null); put(DOOR_X + 1, y, DOOR_Z, BAND, null); }
for (let y = 2; y <= 4; y++) put(DOOR_X, y, DOOR_Z, BAND, null);
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 0, DOOR_Z, "dark_oak_door", doorState("lower"));
put(DOOR_X, 1, DOOR_Z, "dark_oak_door", doorState("upper"));
del(DOOR_X, 0, DOOR_Z - 1); del(DOOR_X, 1, DOOR_Z - 1);

// 5. Air gaps behind the glass (the pane's inner cell, two rows of the window only), and a lit window now and then.
const panes = [...occ.entries()].filter(([, v]) => v.glass).map(([k, v]) => [k, v]);
for (const [k, v] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (x === DOOR_X && z === DOOR_Z) continue;
  const [dx, dz] = v.out;
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || distAt(ix, iz) < 2) continue;           // thin wings: the pane is flush, nothing carved through
  const inner = occ.get(k3(ix, y, iz));
  if (inner && inner.glass) continue;
  del(ix, y, iz);
  if (v.row === 2 && ((x * 7 + y * 3 + z * 5) % 5 === 0)) {
    const ox = x - 2 * dx, oz = z - 2 * dz;
    if (inFp(ox, oz) && distAt(ox, oz) >= 2) put(ox, y, oz, GLOW, null);
  }
}
// 6. Panes join their neighbours and any solid face beside them (in-plane piers, the wall behind), then the volume is written.
for (const [k, v] of occ) {
  if (!v.glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => solidAt(x + dx, y, z + dz) ? "true" : "false";
  v.s = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
  v.b = "glass_pane";
}

const g = new Voxels([W, H, D]);
for (const [k, v] of occ) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.b, v.s ?? undefined);
}
const { blocks, palette } = g.save(OUT);
console.log(`FR241937500: ${blocks} blocks, ${palette} palette entries -> ${OUT}`);
