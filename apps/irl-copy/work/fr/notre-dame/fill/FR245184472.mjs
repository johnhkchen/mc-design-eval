// FR245184472: a Haussmann-era residential block (1873, seven storeys: a shopfront ground floor, five upper storeys and a
// zinc-grey attic under a flat cap), in Paris limestone on the lidar footprint. Storey lines sit on y = 1 mod 4 (a string
// course that is also the floor slab), windows on the two rows above, a lintel below the next string. The lidar's tiers
// (5, 9, 13, ... 29) are the roofs: the core (29) is the tall block, the lower wings step down. The walls are one block
// thick on the outside faces and hollow inside (air behind the glass, a floor slab per storey), so only the shell reads.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184472.cells.json`, "utf8"));

const W = 21, D = 17, H = 44;
const TIERS = [5, 9, 13, 17, 21, 25, 29];   // all 1 mod 4: each tier top is a roof row (y = T-1)

const fp = new Map();                       // "x,z" -> { g, lidar, T }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => at(x, z)?.T ?? 0;   // no building cell: open air
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// Smooth the lidar: 3x3 median, then snap to the nearest tier (kills the noisy edge cells and the stepped roof).
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best));
}

// Which faces of a cell at height y face open air (a neighbour that does not reach that row, or none at all).
const exposed = (x, z, y) => NEI.filter(([, dx, dz]) => topAt(x + dx, z + dz) <= y).map(([n]) => n);

// The street door: the middle of the south face's run of upper-tier cells (the storefront is the ground floor there).
const southRun = [];
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (at(x, z).T >= 9 && exposed(x, z, 2).includes("south")) southRun.push(x);
}
southRun.sort((a, b) => a - b);
const DOOR_X = southRun[Math.floor(southRun.length / 2)], DOOR_Z = D - 1;

// Lights: a glowstone just inside some upper-floor windows (a warm room behind the glass, on the floor slab below).
const lights = new Set();
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const { T } = at(x, z);
  for (let y = 6; y < T - 2; y += 4) {                // the window row above each upper floor's string course
    const ex = exposed(x, z, y);
    if (!ex.length || (x * 7 + z * 3 + y) % 11 !== 0) continue;
    const [dx, dz] = ex.includes("south") ? [0, -1] : ex.includes("north") ? [0, 1] : ex.includes("west") ? [1, 0] : [-1, 0];
    if (!at(x + dx, z + dz) || exposed(x + dx, z + dz, y).length) continue;   // the room behind must be interior air
    lights.add(`${x + dx},${y},${z + dz}`);
  }
}

// Classify one voxel: [block, state] or null (air).
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const { T } = c;
  if (y >= T) return null;
  if (y === 0) return ["stone_bricks"];                          // the plinth, on the foundation of the lowest ground
  if (y === T - 1) return ["deepslate_tiles"];                  // the roof cap (zinc-grey attic / flat cap)
  if (y === T - 2) return ["calcite"];                          // cornice: a solid course under the cap
  if (y % 4 === 1) return ["smooth_quartz"];                    // string course, floor slab in every room
  if (y % 4 === 0) {                                            // lintel row (the ground floor's fascia)
    const ex = exposed(x, z, y); if (!ex.length) return null;
    return y === 4 && c.T >= 9 ? ["dark_oak_planks"] : ["calcite"];
  }
  // window band: rows 2 and 3 above a string course
  const ex = exposed(x, z, y); if (!ex.length) return null;     // interior: air behind the glass
  if (x === DOOR_X && z === DOOR_Z && y <= 3) {
    return y === 2 ? ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }]
                   : ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  const along = ex.includes("north") || ex.includes("south") ? x : z;   // index along the face the cell shows
  if (along % 3 === 0) return ["calcite"];                      // piers between the bays
  return ["glass"];
}

const g = new Voxels([W, H, D]);
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const { T } = at(x, z);
  for (let y = 0; y < T; y++) {
    const b = cls(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
  // Chimney stacks on the core: a brick flue up through the cap, on interior cells only.
  if (T === 29 && x % 6 === 4 && z % 5 === 2 && !exposed(x, z, 28).length) {
    g.set(x, 29, z, "bricks"); g.set(x, 30, z, "bricks");
  }
}
for (const k of lights) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, "glowstone"); }

const { blocks, palette } = g.save(`${DIR}/FR245184472.nbt`);
console.log(`FR245184472.nbt: ${blocks} blocks, ${palette} palette entries; door at x=${DOOR_X}, z=${DOOR_Z}; ${lights.size} lights`);
