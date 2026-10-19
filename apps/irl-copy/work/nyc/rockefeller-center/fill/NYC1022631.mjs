// NYC1022631: 1155 Avenue of the Americas, a 1984 office tower: a glass curtain wall in blue-green tinted glass with
// light concrete spandrels and aluminium mullions, on a granite base with a lobby and a canopy on the north front.
// The lidar roof gives a 47-storey tower (141 blocks, a louvred plant room on its core), a 15-storey west wing, an
// 8-storey base across the north and a 3-storey block on the south-west. The open ground of the lot is paved. A cell is
// open where the lidar reads ~0 and most of its neighbours do too; a single lidar hole inside a building is filled.
// A detached patch of 100+ block readings on the west edge (not joined to the tower) is taken as lidar noise and set to
// its neighbours' height. Each storey is a light concrete spandrel with glass rows above it, every third facade cell a
// mullion, the interior a floor slab per storey with air between, and warm shroomlights behind some of the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022631.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 55, D = 35, H = 150;
const TOWER_TOP = 141;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFp = (x, z) => raw.has(key(x, z));
const NB = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const median = (a) => [...a].sort((p, q) => p - q)[(a.length - 1) >> 1];
const around = (x, z) => Object.values(NB).map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFp(a, b));

// Which cells build: roof above 3 blocks, or a hole in the lidar inside a building (7 or more of 8 neighbours built).
const built = new Set();
for (const [x, z, , roof] of cells) {
  const n = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) n.push(raw.get(key(x + dx, z + dz)).roof > 3);
  if (roof > 3 || n.filter(Boolean).length >= 7) built.add(key(x, z));
}

// Massing height per built cell: the median of the built readings in its 3 x 3 neighbourhood.
const mass = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z]).filter(([x, z]) => built.has(key(x, z)))) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = raw.get(key(x + dx, z + dz));
    if (c && c.roof > 3) vals.push(c.roof);
  }
  mass.set(key(x, z), median(vals));
}

// The tall readings (100+) must join the tower; a detached patch on the west edge is noise.
const tallKeys = [...mass].filter(([, m]) => m >= 100).map(([k]) => k);
const seen = new Set();
let main = [];
for (const start of tallKeys) {
  if (seen.has(start)) continue;
  const comp = [], stack = [start]; seen.add(start);
  while (stack.length) {
    const k = stack.pop(); comp.push(k);
    const [x, z] = k.split(",").map(Number);
    for (const [a, b] of around(x, z)) if (mass.get(key(a, b)) >= 100 && !seen.has(key(a, b))) { seen.add(key(a, b)); stack.push(key(a, b)); }
  }
  if (comp.length > main.length) main = comp;
}
for (const k of tallKeys) {
  if (main.includes(k)) continue;
  const [x, z] = k.split(",").map(Number);
  const low = around(x, z).map(([a, b]) => mass.get(key(a, b))).filter((m) => m < 100);
  mass.set(k, low.length ? median(low) : 45);
}

// Storey-quantised tops (exclusive y): 3-block storeys, the tower capped at its 141-block top.
const TOP = new Map();
const OPEN = new Set();
for (const [x, z, ground] of cells) {
  const k = key(x, z);
  if (!built.has(k)) { OPEN.add(k); TOP.set(k, ground); continue; }
  TOP.set(k, Math.min(TOWER_TOP, Math.round(mass.get(k) / 3) * 3));
}
const topOf = (x, z) => (inFp(x, z) ? TOP.get(key(x, z)) : 0);

// A core cell sees 3 cells of footprint in every direction, all at the tower top: the plant room sits there.
const core = (x, z) => {
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    if (!inFp(x + dx, z + dz) || TOP.get(key(x + dx, z + dz)) !== TOWER_TOP) return false;
  }
  return true;
};
const crown = new Set();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (mass.get(key(x, z)) >= 142 && core(x, z)) crown.add(key(x, z));
}

// A face is exposed where the next cell is outside the footprint or its top is at or below this storey (a setback).
const exposed = (x, z, y) => Object.entries(NB).filter(([, [dx, dz]]) => !inFp(x + dx, z + dz) || topOf(x + dx, z + dz) <= y).map(([f]) => f);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const panes = [];

for (const [x, z, ground] of cells) {
  const k = key(x, z);
  if (OPEN.has(k)) {
    for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
    put(x, ground, z, "smooth_stone");                                  // paved open ground
    continue;
  }
  const T = TOP.get(k);
  for (let y = 0; y < ground; y++) put(x, y, z, "polished_granite");    // foundation under the cell's ground
  for (let y = ground; y < T; y++) {
    const faces = exposed(x, z, y);
    if (y === T - 1) { put(x, y, z, faces.length ? "polished_granite" : "light_gray_concrete"); continue; }   // cornice / roof deck
    if (!faces.length) { if (y % 3 === 0) put(x, y, z, "light_gray_concrete"); continue; }                // interior: slab per storey
    const f = faces[0];
    const along = f === "N" || f === "S" ? x : z;
    const len = f === "N" || f === "S" ? W : D;
    const pier = faces.length > 1 || along % 3 === 0 || along === len - 1;
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                                        // plinth
    if (y < 3) { put(x, y, z, pier ? "polished_granite" : "tinted_glass"); continue; }                  // lobby level
    if (y % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; }                                 // spandrel
    if (pier) { put(x, y, z, "iron_block"); continue; }                                                 // mullion
    const along2 = f === "N" || f === "S" ? { east: "true", west: "true" } : { north: "true", south: "true" };
    put(x, y, z, "cyan_stained_glass_pane", { ...{ north: "false", east: "false", south: "false", west: "false" }, ...along2, waterlogged: "false" });
    panes.push([x, y, z, f]);
  }
  if (crown.has(k)) {
    const ring = (dx, dz) => !crown.has(key(x + dx, z + dz));
    const edge = ring(-1, 0) || ring(1, 0) || ring(0, -1) || ring(0, 1);
    for (let y = TOWER_TOP; y < TOWER_TOP + 3; y++) {
      if (y === TOWER_TOP + 2) put(x, y, z, "light_gray_concrete");                                   // plant room roof
      else if (edge) put(x, y, z, y === TOWER_TOP ? "light_gray_concrete" : "iron_bars", y === TOWER_TOP ? undefined : { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
    }
  }
}

// Warm light: some of the glass has a shroomlight in the room behind it.
for (const [x, y, z, f] of panes) {
  if ((x * 31 + y * 17 + z * 7) % 13 !== 0) continue;
  const [dx, dz] = NB[f];
  const ix = x - dx, iz = z - dz;
  if (inFp(ix, iz) && topOf(ix, iz) > y && !exposed(ix, iz, y).length) put(ix, y, iz, "shroomlight");
}

// Entrance on the north front: a dark oak door under a granite canopy.
const DOOR_X = 31;
put(DOOR_X, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) for (let z = 0; z <= 1; z++) {
  put(x, 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const info = g.save(`${dir}/NYC1022631.nbt`);
console.log(JSON.stringify({ blocks: info.blocks, palette: info.palette, tower: TOWER_TOP, crown: crown.size, detached: tallKeys.length - main.length }));
