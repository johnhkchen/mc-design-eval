// The Quays, Auckland: a five-storey, 1990s-style commercial block (precast concrete piers, storey bands, glazed bays,
// a shopfront ground floor on the entrance side). The lidar roof steps it: a low podium and wings at the edges, the
// main body at 21 blocks (five storeys and a cornice), and a central mass at 26 whose upper core sets back from the body.
// The massing is a shell: a one-block facade, an air gap behind the glass, and a floor slab per storey, with a roof slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_464283002.cells.json`, "utf8"));
const [X, Y, Z] = [61, 39, 67];

const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { ground, roof });

const LOW_TOP = 5, MID_TOP = 9, BODY_TOP = 21, TOWER_TOP = 26;
const CORE_ROOF = 23;   // lidar roof at or above this is the central mass

// Distance into the central mass from its edge (1 on the edge), so the tower can set back from the body.
const coreDepth = new Map();
const queue = [];
for (const [k, c] of foot) {
  if (c.roof < CORE_ROOF) continue;
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !((foot.get(key(x + dx, z + dz))?.roof ?? 0) >= CORE_ROOF))) { coreDepth.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i], [x, z] = k.split(",").map(Number), d = coreDepth.get(k);
  for (const [dx, dz] of N4) {
    const n = key(x + dx, z + dz), c = foot.get(n);
    if (c && c.roof >= CORE_ROOF && !coreDepth.has(n)) { coreDepth.set(n, d + 1); queue.push(n); }
  }
}

// Distance from the footprint edge (1 on the edge), for the roof planters that must stay off the facade.
const edgeDepth = new Map();
const eq = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !foot.has(key(x + dx, z + dz)))) { edgeDepth.set(k, 1); eq.push(k); }
}
for (let i = 0; i < eq.length; i++) {
  const k = eq[i], [x, z] = k.split(",").map(Number), d = edgeDepth.get(k);
  for (const [dx, dz] of N4) {
    const n = key(x + dx, z + dz);
    if (foot.has(n) && !edgeDepth.has(n)) { edgeDepth.set(n, d + 1); eq.push(n); }
  }
}

// Clean flat tiers from the lidar: the tower (its core set back 3 cells in), the body, the mid wings, the podium.
function topOf(x, z) {
  const c = foot.get(key(x, z));
  if (!c) return 0;
  if (c.roof >= CORE_ROOF) return (coreDepth.get(key(x, z)) ?? 0) >= 3 ? TOWER_TOP : BODY_TOP;
  if (c.roof <= 8) return LOW_TOP;
  if (c.roof <= 16) return MID_TOP;
  return BODY_TOP;
}
const inM = (x, y, z) => y >= 0 && y < topOf(x, z);
const exposed = (x, y, z) => N4.filter(([dx, dz]) => !inM(x + dx, y, z + dz));

// The entrance: a door on the body's north (z-) face at the middle bay, where the facade runs along x.
const doorCands = [];
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (topOf(x, z) !== BODY_TOP || x % 4 === 0) continue;
  if (exposed(x, 1, z).some(([dx, dz]) => dx === 0 && dz === -1)) doorCands.push(x);
}
doorCands.sort((a, b) => a - b);
const doorX = doorCands[Math.floor(doorCands.length / 2)];
const doorZ = [...foot.keys()].map((k) => k.split(",").map(Number)).find(([x, z]) => x === doorX && topOf(x, z) === BODY_TOP && exposed(x, 1, z).some(([dx, dz]) => dx === 0 && dz === -1))?.[1];

// Every block: key "x,y,z" -> { block, state }. Facade cells are kept apart for the pane connections and the lights.
const B = new Map();
const facade = new Set();
const set = (x, y, z, block, state) => B.set(k3(x, y, z), { block, state });

for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) {                                   // interior: a floor slab per storey, a roof slab, air between
      if (y === T - 1 || y % 4 === 0) set(x, y, z, "light_gray_concrete");
      continue;
    }
    facade.add(k3(x, y, z));
    const runsAlongX = ex.some(([, dz]) => dz !== 0);   // exposed in z, so the facade runs along x
    const u = runsAlongX ? x : z;
    if (y === T - 1) set(x, y, z, "smooth_quartz");                       // cornice / parapet cap
    else if (y === 0) set(x, y, z, "polished_andesite");                  // base course
    else if (y % 4 === 0 || y % 4 === 3) set(x, y, z, "light_gray_concrete"); // storey line and spandrel
    else if (u % 4 === 0) set(x, y, z, "white_concrete");                 // precast pier between the bays
    else set(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

// The door: two blocks in the bay, with a stone lintel over it.
if (doorZ !== undefined) {
  set(doorX, 1, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(doorX, 2, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) set(doorX + dx, 3, doorZ, "smooth_quartz");
}

// Glass panes join their neighbours in the facade plane (a frame of piers and bands); some get a warm light behind.
for (const [k, v] of [...B]) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const ex = exposed(x, y, z);
  const runsAlongX = ex.some(([, dz]) => dz !== 0);
  const conn = (dx, dz) => facade.has(k3(x + dx, y, z + dz)) ? "true" : "false";
  const state = runsAlongX
    ? { north: "false", south: "false", east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" }
    : { north: conn(0, -1), south: conn(0, 1), east: "false", west: "false", waterlogged: "false" };
  v.state = state;
  const u = runsAlongX ? x : z;
  if ((u >> 2) % 3 === 0 && y % 4 === 1 && ex.length === 1) {   // one bay in three, the lower row of each storey: a regular rhythm
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz;
    if (inM(ix, y, iz) && !facade.has(k3(ix, y, iz))) set(ix, y, iz, "glowstone");
  }
}

// Roof terraces: two planters (stone-brick trough, leafy hedge) on the body roof, clear of the edges and the tower.
const planted = new Set();
let planters = 0;
for (const k of foot.keys()) {
  if (planters >= 2) break;
  const [x0, z0] = k.split(",").map(Number);
  const cells4 = [];
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) cells4.push([x0 + dx, z0 + dz]);
  const ok = cells4.every(([x, z]) => foot.has(key(x, z)) && topOf(x, z) === BODY_TOP && !coreDepth.has(key(x, z))
    && (edgeDepth.get(key(x, z)) ?? 0) >= 3 && !planted.has(key(x, z)));
  if (!ok) continue;
  for (const [x, z] of cells4) {
    planted.add(key(x, z));
    set(x, BODY_TOP, z, "stone_bricks");
    set(x, BODY_TOP + 1, z, "oak_leaves", { persistent: "true" });
  }
  planters++;
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/way_464283002.nbt`);
console.log(`way_464283002: ${out.blocks} blocks, ${out.palette} palette entries, ${planters} roof planters, door at x=${doorX} z=${doorZ}`);
