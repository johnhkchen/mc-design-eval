// 535 Madison Avenue, 1981 commercial and office tower: a 25 x 23 footprint on a granite podium that runs the full
// block and rises 12 blocks (four storeys of shopfront, windows and granite bands). Above it a glass-and-spandrel
// curtain-wall tower (3-block storeys, light stone spandrel every third row, dark mullions every third bay, blue glass
// between) with a granite cornice and parapet on each roof. Lidar roofs snap to three clean tiers: a lower SW wing at
// 103, a 122 step on the NW, the 126 main tower, and a 128 mechanical penthouse on the lidar's central cluster
// (x 11-15, z 2-5). Two setbacks cut the tower's east edge above 90 and its north edge above 108. A solid core
// (x 10-14, z 9-13) carries the floor slabs. The shell is one block thick with air behind the glass, one slab per
// storey, and no interiors. The Madison Avenue face (x 0) has a recessed lobby with a black soffit and a hanging
// lantern; glowstone sits behind about one window in nine. Gaps in the lidar roof take the median of their neighbours.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035747.cells.json`, "utf8"));
const X = 25, Z = 23, Y = 140;

const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => raw.has(`${x},${z}`);

// Lidar gaps (roof 0) inside the footprint take the median of their roofed neighbours.
const roof = new Map();
for (const [key, { roof: r }] of raw) {
  if (r > 0) { roof.set(key, r); continue; }
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = raw.get(`${x + dx},${z + dz}`);
    if (v && v.roof > 0) near.push(v.roof);
  }
  near.sort((a, b) => a - b);
  roof.set(key, near[Math.floor(near.length / 2)]);
}

const PODIUM = 12;                                               // tower starts above the podium cornice (row 11)
const PENT = { x0: 11, x1: 15, z0: 2, z1: 5 };
const CORE = { x0: 10, x1: 14, z0: 9, z1: 13 };
const tier = (r) => (r <= 110 ? 103 : r <= 124 ? 122 : 126);

// Top of each column (exclusive). Setbacks and the penthouse only sit on the 126 main tower.
function topOf(x, z) {
  let top = tier(roof.get(`${x},${z}`));
  if (top === 126) {
    if (x >= 23) top = Math.min(top, 90);                        // east setback, its terrace at 89
    if (z <= 1) top = Math.min(top, 108);                        // north setback, its terrace at 107
    if (x >= PENT.x0 && x <= PENT.x1 && z >= PENT.z0 && z <= PENT.z1) top = 128;
  }
  return top;
}

const recess = (x, y, z) => x <= 1 && z >= 10 && z <= 12 && y <= 4;   // lobby recess on the Madison face
const isOcc = (x, y, z) => inFoot(x, z) && y >= 0 && y < topOf(x, z) && !recess(x, y, z);
const isCore = (x, z) => x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1;
const isSlabRow = (y) => y % 3 === 0;

// A shell cell has an open face: x-faces are bays along z, z-faces are bays along x; corners are piers.
function faces(x, y, z) {
  return { fx: !isOcc(x - 1, y, z) || !isOcc(x + 1, y, z), fz: !isOcc(x, y, z - 1) || !isOcc(x, y, z + 1) };
}
function isMullion(x, z, { fx, fz }) {
  return (fx && fz) || (fx ? z : x) % 3 === 0;
}
const isShell = (x, y, z) => isOcc(x, y, z) && (faces(x, y, z).fx || faces(x, y, z).fz);

function blockAt(x, y, z) {
  if (!isOcc(x, y, z)) return null;
  if (y === topOf(x, z) - 1) return "polished_andesite";          // parapet, cornice and terrace caps
  if (y === 11) return "polished_andesite";                       // podium cornice spans the whole base
  if (y === 5 && x <= 1 && z >= 9 && z <= 13) return "black_concrete";   // lobby soffit over the recess
  if (isCore(x, z)) return "light_gray_concrete";                // structural core
  if (isSlabRow(y)) return y < PODIUM ? "polished_andesite" : "light_gray_concrete";   // floor slabs and spandrels
  if (!isShell(x, y, z)) return null;                            // air behind the glass
  const f = faces(x, y, z);
  if (isMullion(x, z, f)) return y < PODIUM ? "polished_andesite" : "gray_concrete";
  return y < 3 ? "glass" : "light_blue_stained_glass";
}

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 0; y < topOf(x, z); y++) {
    const b = blockAt(x, y, z);
    if (b) g.set(x, y, z, b);
  }
}

// Warm light: about one window in nine shows a glowstone just inside the glass (never on a slab row).
let glow = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 1; y < topOf(x, z); y++) {
    if (isSlabRow(y) || y < 3 || !isShell(x, y, z) || (x * 31 + y * 17 + z * 7) % 9 !== 0) continue;
    const f = faces(x, y, z);
    if (isMullion(x, z, f) || y === 5 || y > topOf(x, z) - 3) continue;
    const inside = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
      .find(([ix, iz]) => isOcc(ix, y, iz) && !isShell(ix, y, iz) && !isCore(ix, iz));
    if (inside) { g.set(inside[0], y, inside[1], "glowstone"); glow++; }
  }
}

// Lobby lantern hangs from the soffit in the recess.
g.set(0, 4, 11, "lantern", { hanging: "true" });

const stats = g.save(`${DIR}/NYC1035747.nbt`);
console.log(JSON.stringify({ ...stats, glow }));
