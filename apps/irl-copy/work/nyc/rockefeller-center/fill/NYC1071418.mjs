// 49 West 52nd Street, the Hines Building: a 1986 commercial and office block read from its lidar record as a 7-storey
// granite podium (roof 21 blocks, about 23 m) carrying a stepped tinted-glass tower that rises to 117 blocks (about 130 m,
// 39 storeys at 3 blocks each), with a 6-block penthouse on its centre. Footprint 62 x 49, x across the 52nd Street
// frontage (low z = north). Lidar roof is smoothed into tiers (6 / 21 / 42 / 72 / 99 / 108 / 117): a 3x3 majority vote
// on the tier index kills single-cell noise, and lidar gaps with three or more built neighbours are closed. Open lidar
// cells left as ground are paving. Every cell is solid from y 0 (or its ground) up to its tier, so nothing floats.
// Structure: a hollow shell per tier. Perimeter cells are the facade (granite base and spandrels, shopfront glass on
// the podium, grey-tinted glass bays between iron mullions on the tower, a granite cornice and parapet at each roof
// edge); interior cells are air with a floor slab every storey. Warm glowstone sits behind some panes, and a
// lobby with a canopy and doors sits on the podium's south face. Rooftop boxes stand on the terraces.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1071418.cells.json`, "utf8"));
const X = 62, Y = 130, Z = 49;

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Lidar height to tier. Zero stays open ground.
const tierOf = (h) => (h <= 0 ? 0 : h <= 10 ? 6 : h <= 20 ? 21 : h <= 50 ? 42 : h <= 90 ? 72 : h <= 100 ? 99 : h <= 108 ? 108 : 117);
// Most common value; ties go to the taller tier so the massing is not notched.
const mode = (vals) => {
  const n = new Map();
  for (const v of vals) n.set(v, (n.get(v) || 0) + 1);
  let best = 0, count = -1;
  for (const [v, c] of n) if (c > count || (c === count && v > best)) { best = v; count = c; }
  return best;
};

// Pass 1: tiers from lidar. Pass 2: close lidar gaps walled in by built neighbours. Pass 3: 3x3 majority over built cells.
const T1 = new Map([...cell].map(([k, { roof }]) => [k, tierOf(roof)]));
const T2 = new Map(T1);
for (const [k, t] of T1) {
  if (t) continue;
  const [x, z] = k.split(",").map(Number);
  const built = NB.map(([dx, dz]) => T1.get(key(x + dx, z + dz)) ?? 0).filter((v) => v > 0);
  if (built.length >= 3) T2.set(k, mode(built));
}
const T3 = new Map();
for (const [k, t] of T2) {
  if (!t) { T3.set(k, 0); continue; }
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = T2.get(key(x + dx, z + dz)) ?? 0;
    if (v) vals.push(v);
  }
  T3.set(k, mode(vals));
}
// The centre of the 117 tower carries a 6-block penthouse (roof equipment and a stair and lift house).
for (const [k, t] of T3) {
  const [x, z] = k.split(",").map(Number);
  if (t === 117 && x >= 16 && x <= 32 && z >= 14 && z <= 30) T3.set(k, 123);
}

// Open for the purposes of walls and roofs: outside the footprint, open ground, or a roof at or below y.
const roofAt = (x, z) => T3.get(key(x, z)) ?? 0;
const open = (x, y, z) => roofAt(x, z) <= y;
const exposed = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => open(x + dx, y, z + dz)).map(([d]) => d);
const podiumAt = (T) => T <= 21;

// Materials
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // a face along z
const GLASS = "gray_stained_glass_pane";
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// Entrance: the podium's south face, a door pair and a glass lobby behind it, under a short canopy.
const DOOR_X = 35, DOOR_Z = 48;

// 1. Solid mass, foundation, roof covering and paving on open ground.
for (const [x, z] of cols) {
  const { ground } = cell.get(key(x, z));
  const T = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  if (!T) { g.set(x, ground, z, "smooth_stone"); continue; }
  for (let y = ground; y < T; y++) {
    const ex = exposed(x, y, z);
    const isCap = y === T - 1;
    if (isCap) { g.set(x, y, z, ex.length ? "polished_granite" : "gray_concrete"); continue; }   // cornice / roof membrane
    if (!ex.length) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }             // floor slab; air gap inside
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                                 // base course
    if (ex.length >= 2) { g.set(x, y, z, podiumAt(T) || y % 3 === 0 ? "polished_granite" : "iron_block"); continue; }   // corner fin
    const d = ex[0], [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;               // position along the face
    const pane = dx === 0 ? PANE_NS : PANE_EW;
    if (y % 3 === 0) { g.set(x, y, z, podiumAt(T) ? "polished_granite" : "light_gray_concrete"); continue; }   // spandrel band
    if (podiumAt(T) && y < 3) { g.set(x, y, z, u % 3 === 0 ? "polished_granite" : "glass"); continue; }      // shopfront
    if (u % 3 === 0) { g.set(x, y, z, podiumAt(T) ? "polished_granite" : "iron_block"); continue; }          // mullion
    g.set(x, y, z, GLASS, pane);
  }
}

// 2. Entrance on the podium's south face: a door pair at y 1-2, granite piers beside it, and a canopy over it at y 3.
for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) {
  if (roofAt(x, DOOR_Z) === 0) continue;
  g.set(x, 3, DOOR_Z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, 3, DOOR_Z - 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
for (const y of [1, 2]) {
  g.set(DOOR_X, y, DOOR_Z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  g.set(DOOR_X - 1, y, DOOR_Z, "polished_granite");
  g.set(DOOR_X + 1, y, DOOR_Z, "polished_granite");
  g.set(DOOR_X, y, DOOR_Z - 1, "glowstone");   // lobby light behind the door
}

// 3. Warm lights behind some panes: an interior cell one block in from a glass face, kept as air around it.
for (const [x, z] of cols) {
  const T = roofAt(x, z);
  if (!T) continue;
  for (let y = 1; y < T - 1; y++) {
    if (y % 3 === 0) continue;
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;
    const d = ex[0], [dx, dzz] = DIRS[d];
    const u = dx === 0 ? x : z;
    if (u % 3 === 0) continue;
    if (podiumAt(T) && y < 3) continue;
    const k = { N: 1, S: 2, E: 3, W: 4 }[d];
    if (!lit(u, y, k)) continue;
    const ix = x - dx, iz = z - dzz;
    if (roofAt(ix, iz) <= y || exposed(ix, y, iz).length) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 4. Roof: parapets at each open roof edge, rooftop boxes on the terraces (air-free: each box stands on the roof cap).
for (const [x, z] of cols) {
  const T = roofAt(x, z);
  if (!T) continue;
  const edge = NB.some(([dx, dzz]) => open(x + dx, T, z + dzz));
  if (edge) g.set(x, T, z, "polished_granite");
  else if (T > 21 && T < 123 && (x * 5 + z * 3) % 13 === 0) {
    g.set(x, T, z, "light_gray_concrete");
    g.set(x, T + 1, z, "light_gray_concrete");
  }
}

// The penthouse cap: a granite lid over the 123 block centre.
for (const [x, z] of cols) if (roofAt(x, z) === 123) g.set(x, 122, z, "polished_granite");

const stats = g.save(`${DIR}/NYC1071418.nbt`);
const tiers = {};
for (const [, t] of T3) if (t) tiers[t] = (tiers[t] || 0) + 1;
console.log("tiers (cells):", JSON.stringify(tiers));
console.log("blocks:", stats.blocks, "palette:", stats.palette, "top:", Math.max(...T3.values()));
