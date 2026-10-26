import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A residential block, Haussmann-era brick with stone bands (1890, 7 storeys). Storeys are 4 blocks (about 2.9 m at
// 1.4 blocks a metre); the lidar roof of 29 is 7 storeys, the deck at y 28. Lower tiers step down to 6 and 5 storeys.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938054.cells.json", "utf8"));
const X = 16, Z = 15, STOREY = 4, H = 45;

const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && roofAt.has(`${x},${z}`);

// the lidar's roof per cell, smoothed over its 3x3 neighbourhood so single-cell noise doesn't make a sawtooth
const roofSmooth = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) { s += r; n++; }
  }
  return s / n;
};
const storeys = (x, z) => { const r = roofSmooth(x, z); return r >= 27 ? 7 : r >= 20 ? 6 : 5; };
const top = (x, z) => storeys(x, z) * STOREY + 1;   // solid below top; the deck is the layer top - 1
const occ = (x, y, z) => inFp(x, z) && y >= 0 && y < top(x, z);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !occ(x + dx, y, z + dz));

// the entrance: the middle of the street face (z = 0), dark wood door in the window bay
const DOOR_X = 7;
const isDoor = (x, y, z) => z === 0 && x === DOOR_X && (y === 1 || y === 2);

// what a footprint cell's block is at height y; null leaves it air (the hollow interior behind the glass)
function role(x, y, z, ex) {
  const T = top(x, z), deck = T - 1, shell = ex.length > 0;
  if (y === 0) return shell ? ["stone_bricks"] : ["smooth_stone"];          // base course, then the ground floor slab
  if (y === deck) return shell ? ["calcite"] : ["deepslate_tiles"];           // cornice, then the flat roof
  if (!shell) return y % STOREY === 0 ? ["smooth_stone"] : null;              // a floor slab per storey, air between
  if (y % STOREY === 0) return ["calcite"];                                   // the storey string course
  const fx = ex.some(([dx]) => dx !== 0), fz = ex.some(([, dz]) => dz !== 0);
  if (fx && fz) return ["calcite"];                                           // quoins at the corners
  const u = fz ? x : z;                                                       // position along the facade
  if (u % 3 === 0) return ["bricks"];                                         // piers between the windows
  if (y % STOREY === 3) return ["bricks"];                                    // window heads, brick over the glass
  if (isDoor(x, y, z)) return ["dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  return ["glass"];
}

const g = new Voxels([X, H, Z]);
const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);

const cellXZ = () => [...roofAt.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of cellXZ()) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    const r = role(x, y, z, exposed(x, y, z));
    if (r) put(x, y, z, r);
  }
}

// the parapet on the top tier's outer walls, and the chimney stacks on its deck
const tier7 = (x, z) => storeys(x, z) === 7;
for (const [x, z] of cellXZ()) {
  if (tier7(x, z) && exposed(x, top(x, z) - 1, z).length) put(x, top(x, z), z, ["bricks"]);
}
for (const [x, z] of [[4, 5], [11, 5], [8, 9]]) {
  if (!tier7(x, z) || exposed(x, top(x, z) - 1, z).length) continue;
  for (let y = top(x, z); y <= top(x, z) + 2; y++) put(x, y, z, ["bricks"]);
  put(x, top(x, z) + 3, z, ["calcite"]);
}

// warm light behind some glass: a glowstone in the air cell just inside the window
for (const [x, z] of cellXZ()) {
  for (let y = 2; y < top(x, z); y += STOREY) {       // the upper glazing row of each storey
    const ex = exposed(x, y, z);
    if (!ex.length || role(x, y, z, ex)?.[0] !== "glass") continue;
    if ((x * 7 + z * 3 + y) % 6 !== 0) continue;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;   // the air cell just inside the pane
    if (!occ(ix, y, iz) || exposed(ix, y, iz).length) continue;
    put(ix, y, iz, ["glowstone"]);
  }
}

const n = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938054.nbt");
console.log(`FR241938054: ${n.blocks} blocks, ${n.palette} palette entries`);
