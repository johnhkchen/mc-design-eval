// Barrington Building: a concrete-frame office block read from the lidar record. Most of the footprint is a 5-6 storey
// slab (roof 22 and 26, 4 blocks a storey); a lift-and-stair tower on the west side goes up to 44. The 44 spikes that
// lie on the west edge elsewhere are lidar edge noise and are clamped to the slab. Grey concrete bands and spandrels,
// white piers, tinted glazing; a ground-floor base course and a north entrance under a lintel canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_884055553.cells.json`, "utf8"));
const W = 26, D = 37, H = 57;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const LIGHT = new Set(["glowstone", "shroomlight"]);

// footprint: "x,z" -> { ground, roof }
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);

// flat tiers: 22 (5 storeys + cap), 26 (6 storeys + cap), a 44 tower on the west side stepping in from a 38 ring
const towerCell = (x, z) => x >= 4 && x <= 6 && z >= 10 && z <= 13;
const towerCore = (x, z) => x >= 4 && x <= 5 && z >= 11 && z <= 13;
const T = (x, z) => (towerCore(x, z) ? 44 : towerCell(x, z) ? 38 : foot.get(`${x},${z}`).roof >= 25 ? 26 : 22);
// a column cell is wall where it is on the footprint edge or stands above a lower neighbour's roof
const exposed = (x, y, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);
const row = (y) => (y - 1) % 4;      // 0 floor band, 1-2 glazing, 3 spandrel
const storey = (y) => Math.floor((y - 1) / 4);
const isPane = (b) => b.endsWith("_pane");

const M = new Map();
const put = (x, y, z, block, state) => {
  if (!inF(x, z) || x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;   // footprint cells only
  M.set(`${x},${y},${z}`, { x, y, z, block, state });
};
const has = (x, y, z) => M.has(`${x},${y},${z}`);

const wall = (x, y, z, s, r) => {
  if (r === 0) return put(x, y, z, s === 0 ? "polished_andesite" : "light_gray_concrete");
  if (r === 3) return put(x, y, z, "gray_concrete");
  if ((x + z) % 3 === 0) return put(x, y, z, "white_concrete");                       // pier
  put(x, y, z, s === 0 ? "glass_pane" : "light_blue_stained_glass_pane");
};

// shell: foundation to the ground, walls on the exposed faces, a floor slab per storey inside, a roof slab on top
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const top = T(x, z);
  for (let y = 0; y <= foot.get(key).ground; y++) put(x, y, z, "stone_bricks");
  for (let y = 1; y < top; y++) {
    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }                  // roof slab / cornice
    if (exposed(x, y, z)) wall(x, y, z, storey(y), row(y));
    else if (row(y) === 0) put(x, y, z, "light_gray_concrete");                      // floor slab, air behind the glass
  }
}

// north entrance: iron doors, a lintel canopy over them
for (const x of [9, 10, 11]) put(x, 3, 1, "light_gray_concrete");
put(10, 1, 1, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(10, 2, 1, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(10, 2, 2, "glowstone");                                                           // lobby light behind the door

// warm light in some upper-office windows: a lamp in the air just inside the glass
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 5; y < T(x, z) - 1; y++) {
    const c = M.get(`${x},${y},${z}`);
    if (!c || !isPane(c.block) || storey(y) < 1 || (x * 7 + z * 5 + y * 3) % 9 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!inF(nx, nz) || exposed(nx, y, nz) || has(nx, y, nz)) continue;
      put(nx, y, nz, (x + y) % 2 ? "shroomlight" : "glowstone");
      break;
    }
  }
}

// roof plant: small units on the slabs, and a plant room on the tower
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const top = T(x, z);
  if (top === 44 || exposed(x, top - 2, z)) continue;
  if ((x * 3 + z * 5) % 13 === 0 && (x + z) % 2 === 0) { put(x, top, z, "gray_concrete"); put(x, top + 1, z, "gray_concrete"); }
}
for (let x = 4; x <= 5; x++) for (let z = 11; z <= 12; z++) { put(x, 44, z, "light_gray_concrete"); put(x, 45, z, "gray_concrete"); }

// glass panes connect to their neighbours in the wall plane, as the game would draw them
const names = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const c of M.values()) {
  if (!isPane(c.block)) continue;
  const st = { waterlogged: "false" };
  for (const [n, [dx, dz]] of Object.entries(names)) {
    const nb = M.get(`${c.x + dx},${c.y},${c.z + dz}`);
    st[n] = nb && (isPane(nb.block) || (!LIGHT.has(nb.block) && !nb.block.endsWith("_door"))) ? "true" : "false";
  }
  c.state = st;
}

const g = new Voxels([W, H, D]);
for (const c of M.values()) g.set(c.x, c.y, c.z, c.block, c.state);
console.log(g.save(`${DIR}/way_884055553.nbt`));
