// FR245184796: a commercial block on the Seine's left bank, cream Haussmann stone over shopfronts. The lidar's roof
// heights (9 x 18 footprint) are smoothed into four tiers: a 32-block tower on the west edge, a 20-block podium
// beside it, a 15-block mid wing at the north end and an 8-block low wing, with a one-storey shop on the south edge.
// Each tier is a shell: a one-block wall ring, floor slabs on the storey lines, and air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184796.cells.json", "utf8"));
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// the lidar's roof height, snapped to the tier it belongs to (the raw cells are noisy at the tower's foot and the wing edges)
function tierOf(x, z, raw) {
  if (x === 0) return z <= 11 ? 32 : 8;                          // tower on the west edge, low wing beyond it
  if (x === 1) return z <= 2 ? 20 : 8;                           // podium at the tower's foot
  if (z <= 1 || (z === 2 && x <= 4)) return raw >= 13 ? 15 : 8;  // mid wing at the north end
  if (z === 17) return x <= 4 ? 8 : 5;                           // south edge: a one-storey shop past x 4
  return 8;
}
// storey lines per tier (floor slabs); each storey is about 5 blocks, the top one closed by the roof
const FLOORS = { 32: [0, 5, 10, 15, 20, 25], 20: [0, 5, 10, 15], 15: [0, 5, 10], 8: [0, 4], 5: [0] };

const cols = new Map();
for (const [x, z, , roof] of cells) {
  const H = tierOf(x, z, roof);
  cols.set(`${x},${z}`, { H, F: new Set(FLOORS[H]) });
}
const col = (x, z) => cols.get(`${x},${z}`);

// the directions in which a cell at height y has no neighbour to lean on: outside the footprint or shorter than y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = col(x + dx, z + dz); return !n || n.H <= y; });
function solid(x, y, z) {
  const c = col(x, z);
  if (!c || y < 0 || y >= c.H) return false;
  if (y === 0 || y === c.H - 1 || c.F.has(y)) return true;   // ground slab, roof, storey floors
  return exposed(x, z, y).length > 0;                        // interior air unless it is a wall
}

// the storey's top air row is a lintel; the rest of the wall's air rows are glass where there is air behind
function blockAt(x, y, z) {
  const c = col(x, z);
  const ex = exposed(x, z, y);
  if (!ex.length) return c.H - 1 === y ? ["deepslate_tiles"] : ["smooth_stone"];  // interior: roof or floor slab
  if (y === 0) return ["stone_bricks"];                      // rusticated base course
  if (y === c.H - 1) return ["smooth_quartz"];               // parapet
  if (c.F.has(y)) return ["chiseled_quartz_block"];          // string course at every storey line
  const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
  if (xFace && zFace) return ["quartz_pillar"];              // corner
  const along = xFace ? z : x;
  if (along % 2 === 0) return ["quartz_pillar"];             // piers between the windows
  const bounds = [...c.F, c.H - 1].filter((f) => f > y);
  const lintel = y === Math.min(...bounds) - 1;
  const air = ex.some(([dx, dz]) => !solid(x - dx, y, z - dz));
  if (lintel || !air) return ["smooth_quartz"];
  const connect = xFace ? { north: "true", south: "true", east: "false", west: "false" }
                        : { north: "false", south: "false", east: "true", west: "true" };
  return ["glass_pane", { ...connect, waterlogged: "false" }];
}

const g = new Voxels([9, 48, 18]);
const pick = (x, y, z) => {
  // the doorway on the south wall, a lit room behind the east windows, roof plant and a chimney
  if (x === 4 && z === 17 && (y === 1 || y === 2)) return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (x === 7 && y === 5 && [5, 9, 13].includes(z)) return ["glowstone"];
  if (x === 1 && y === 8 && (z === 5 || z === 9)) return ["glowstone"];     // on the low wing's roof, behind the tower's glass
  if (x === 5 && y === 8 && z === 4) return ["iron_block"];
  if (x === 6 && y === 8 && z === 10) return ["iron_block"];
  if (x === 6 && (y === 8 || y === 9) && z === 2) return ["bricks"];
  if (x === 4 && y === 15 && z === 1) return ["iron_block"];
  if (x === 0 && y === 32 && z === 6) return ["lightning_rod"];
  return solid(x, y, z) ? blockAt(x, y, z) : null;
};
for (const [key, c] of cols) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.H; y++) { const b = pick(x, y, z); if (b) g.set(x, y, z, b[0], b[1]); }
}
for (const [x, y, z] of [[1, 8, 5], [1, 8, 9], [5, 8, 4], [6, 8, 10], [6, 8, 2], [6, 9, 2], [4, 15, 1], [0, 32, 6]]) {
  const b = pick(x, y, z); if (b) g.set(x, y, z, b[0], b[1]);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184796.nbt");
