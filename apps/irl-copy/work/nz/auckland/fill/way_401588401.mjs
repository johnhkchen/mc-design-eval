// Way 401588401: a 1960s-70s Auckland concrete office block over a 5-storey podium, with a 6th-storey core.
// Massing from the lidar roof: the 59 m reading lies in a continuous 1-2 cell strip along the SW boundary (an edge
// return, not a 14-storey wall), so those cells take their neighbours' height; the interior reads as a 22-block
// podium (5 storeys, the NE downhill face shows all of them) with a 27-block core in the middle.
// Storeys are 4 blocks on shared levels (floor slab at y = 2 mod 4), so the courses run level across the whole
// block; each column stands on solid ground and every floor slab rests on the walls around it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588401.cells.json", "utf8"));
const W = 39, D = 42, NOISE = 45, PODIUM = 22, CORE = 27;
const G = Array.from({ length: W }, () => new Array(D).fill(null));   // ground per cell
const R = Array.from({ length: W }, () => new Array(D).fill(null));   // raw lidar roof per cell
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Clean massing: noise cells take the median of their clean neighbours; then the clean roof is podium or core.
const H = Array.from({ length: W }, () => new Array(D).fill(null));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  let r = R[x][z];
  if (r >= NOISE) {
    const ns = NB8.map(([a, b]) => [x + a, z + b]).filter(([xx, zz]) => inside(xx, zz) && R[xx][zz] < NOISE).map(([xx, zz]) => R[xx][zz]).sort((a, b) => a - b);
    r = ns.length ? ns[ns.length >> 1] : PODIUM;
  }
  H[x][z] = r >= 25 && r <= 30 ? CORE : PODIUM;
}

// A side is open to the outside air at height y when its neighbour is off the footprint or is below y.
const exposed = (x, y, z) => DIRS.some(([a, b]) => { const nx = x + a, nz = z + b; return !inside(nx, nz) || y >= H[nx][nz]; });
const facesZ = (x, y, z) => [[0, 1], [0, -1]].some(([a, b]) => { const nx = x + a, nz = z + b; return !inside(nx, nz) || y >= H[nx][nz]; });

// Pier columns every third cell on the face; glass between. Storey 0 (y 2-5) is a shopfront.
const isPier = (x, z, y) => (facesZ(x, y, z) ? x : z) % 3 === 0;
const isWallAt = (x, y, z) => inside(x, z) && y >= G[x][z] && y < H[x][z] && (exposed(x, y, z) || y === H[x][z] - 1);

// Entrance: the lowest grade (ground >= 1) perimeter cell, middle of the candidates. Its door sits at that cell's grade.
const perim = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && G[x][z] >= 1 && exposed(x, G[x][z], z)) perim.push([x, z]);
const minG = Math.min(...perim.map(([x, z]) => G[x][z]));
const doorCands = perim.filter(([x, z]) => G[x][z] === minG).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
const [dx0, dz0] = doorCands[doorCands.length >> 1];
const door = { x: dx0, z: dz0, y: G[dx0][dz0] };
const outward = DIRS.find(([a, b]) => !inside(dx0 + a, dz0 + b) || door.y >= H[dx0 + a][dz0 + b]);
const doorFacing = outward[0] === 1 ? "east" : outward[0] === -1 ? "west" : outward[1] === 1 ? "south" : "north";

function kindAt(x, y, z) {
  const g = G[x][z], h = H[x][z];
  if (y < g) return ["stone"];                                 // foundation up to the cell's ground
  if (y === h - 1) return ["gray_concrete"];                   // roof slab
  const ex = exposed(x, y, z);
  if (y === g) return ex ? ["stone_bricks"] : ["light_gray_concrete"];   // base course / ground floor
  const row = (((y - 2) % 4) + 4) % 4;
  if (row === 0) return ex ? ["white_concrete"] : ["light_gray_concrete"]; // storey line / floor slab
  if (!ex) return null;                                         // interior air behind the glass
  if (row === 3) return ["light_gray_concrete"];               // spandrel
  if (isPier(x, z, y)) return ["white_concrete"];
  if (y < 6) return ["glass"];                                 // shopfront
  const conn = { north: isWallAt(x, y, z - 1), south: isWallAt(x, y, z + 1), east: isWallAt(x + 1, y, z), west: isWallAt(x - 1, y, z) };
  return ["light_blue_stained_glass_pane", { north: String(conn.north), south: String(conn.south), east: String(conn.east), west: String(conn.west), waterlogged: "false" }];
}

const g = new Voxels([W, 71, D]);
const placed = new Map();
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < H[x][z]; y++) {
    if (x === door.x && z === door.z && (y === door.y || y === door.y + 1)) {
      put(x, y, z, "iron_door", { facing: doorFacing, half: y === door.y ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const k = kindAt(x, y, z);
    if (!k) continue;
    put(x, y, z, k[0], k[1]);
  }
  // Parapet on the open edge of the roof; lit windows: glowstone / lanterns on the floor just inside the glass.
  if (exposed(x, H[x][z], z)) put(x, H[x][z], z, "white_concrete");
}

// Canopy over the entrance: flush stone slabs across the door and its two neighbours along the face.
const canopyY = door.y + 2;
const along = outward[0] !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
for (const [a, b] of [[0, 0], ...along]) {
  const x = door.x + a, z = door.z + b;
  if (inside(x, z) && exposed(x, canopyY, z)) put(x, canopyY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Warm lights in some bays: glowstone or lantern on the floor slab, just inside a glass pane on the first row.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < H[x][z]; y++) {
    const row = (((y - 2) % 4) + 4) % 4;
    if (row !== 1 || y < 6 || !exposed(x, y, z) || isPier(x, z, y)) continue;
    const idx = facesZ(x, y, z) ? x : z, bay = Math.floor(idx / 3), level = Math.floor((y - 2) / 4);
    const inward = DIRS.map(([a, b]) => [x + a, z + b]).find(([nx, nz]) => inside(nx, nz) && kindAt(nx, y, nz) === null);
    if (!inward) continue;
    const pick = (bay * 2 + level) % 5;
    if (pick === 0) put(inward[0], y, inward[1], "glowstone");
    else if (pick === 2) put(inward[0], y, inward[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant: a 2x2 plant box on the podium away from the edges, and a 3x3 plant room on the core.
for (let x = 0; x + 1 < W; x++) for (let z = 0; z + 1 < D; z++) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([a, b]) => inside(a, b) && H[a][b] === PODIUM && !exposed(a, PODIUM, b))) continue;
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  for (const [a, b] of cs) { put(a, PODIUM, b, "light_gray_concrete"); put(a, PODIUM + 1, b, "iron_block"); }
}
let plantRoom = null;
for (let x = 1; x < W - 1 && !plantRoom; x++) for (let z = 1; z < D - 1 && !plantRoom; z++) {
  const cs = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) cs.push([x + a, z + b]);
  if (cs.every(([a, b]) => inside(a, b) && H[a][b] === CORE && !exposed(a, CORE, b))) plantRoom = [x, z];
}
if (plantRoom) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) put(plantRoom[0] + a, CORE, plantRoom[1] + b, "light_gray_concrete");

// Check: every block above the ground rests on a block below it or beside it at its level.
let floating = 0;
for (const key of placed.keys()) {
  const [x, y, z] = key.split(",").map(Number);
  if (y === 0) continue;
  const below = placed.has(`${x},${y - 1},${z}`);
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => placed.has(`${x + a},${y},${z + b}`));
  if (!below && !beside) floating++;
}
if (floating) console.warn(`floating blocks: ${floating}`);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588401.nbt");
console.log(`way_401588401: ${g.count()} blocks, door ${doorFacing} at (${door.x},${door.y},${door.z}), core plant ${plantRoom ? "yes" : "no"}`);
