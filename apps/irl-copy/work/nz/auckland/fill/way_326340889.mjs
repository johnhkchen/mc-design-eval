// B Block, Auckland (way 326340889): a 1970s four-storey precast-concrete and tinted-glass block on a basalt base, the kind
// of institutional office or teaching block that went up around the Mt Eden ridge. The lidar roof, smoothed by a 3x3 mean
// and cut into four tiers: a 3-storey lower wing (roof 15, parapet to 15), the 4-storey body (roof 17), a setback band
// (roof 18), and a louvred plant core (roof 19) standing on the 4th storey. Storeys are 4 blocks: a floor band at 4k, a sill
// at 4k+1, windows at 4k+2..4k+3, a white pier every third cell. Interiors are air with a floor slab per storey. Lit
// windows show a glowstone on the floor just inside the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340889.cells.json", "utf8"));
const W = 95, D = 56, H = 32;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation top), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// 3x3 mean of the lidar roof over footprint cells: irons out the 1 m DSM speckle at the edges
const S = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) { sum += R[x + dx][z + dz]; n++; }
  S[x][z] = sum / n;
}

// the tier of each cell and its roof: wing 12 (3 storeys, parapet to 14), body 16 (4 storeys), a setback band 17 (the
// lidar's 18), plant 18 (a louvred roof box to 18, surface 19)
const tierOf = (s) => (s < 16 ? "wing" : s < 17.5 ? "body" : s < 18.5 ? "parapet" : "plant");
const CAP = { wing: 12, body: 16, parapet: 17, plant: 18 };
const PARAPET = { wing: 14 };                     // the top of the wing's parapet ring on the footprint's edge cells
const TIER = Array.from({ length: W }, () => Array(D).fill(null));
const CAPY = Array.from({ length: W }, () => Array(D).fill(-1));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  TIER[x][z] = tierOf(S[x][z]); CAPY[x][z] = CAP[TIER[x][z]];
}
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const edge = (x, z) => Object.keys(DIRS).some((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
// a face is exposed where the neighbour is outside the footprint or its roof is lower than this height
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || CAPY[nx][nz] < y;
});

// the entrance: the west wing's middle, on the storey's glazed bay, off the pier line
const DOOR = [0, 28];

const B = new Map();   // "x,y,z" -> { b, s }
const put = (x, y, z, b, s) => B.set(`${x},${y},${z}`, { b, s });
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const pane = (f) => (f.includes("W") || f.includes("E") ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });

// the block of a footprint cell at height y, from its tier, its exposure and the storey it sits in
function blockAt(x, z, y) {
  const t = TIER[x][z], capY = CAPY[x][z], pt = t === "wing" && edge(x, z) ? PARAPET.wing : capY;
  if (y > pt) return null;
  const f = faces(x, z, y), exp = f.length > 0;
  // the plant core: a louvred box on the 4th storey, solid from its floor (17) to its roof (18)
  if (t === "plant") {
    if (y === capY) return exp ? ["light_gray_concrete"] : ["smooth_stone"];
    if (y === 17) return exp ? (x % 3 === 0 || z % 3 === 0 ? ["light_gray_concrete"] : ["iron_bars"]) : ["stone"];
  }
  // a parapet ring above the body's roof: edge cells only
  if (y > capY) {
    if (!exp) return null;
    return y === pt ? ["smooth_stone"] : ["light_gray_concrete"];
  }
  if (y === capY) return exp ? ["light_gray_concrete"] : ["smooth_stone"];   // roof: a cornice band on the edge, a light roof inside
  if (y % 4 === 0) return exp ? [y === 0 ? "stone_bricks" : "light_gray_concrete"] : ["stone"];   // floor band / plinth / slab
  if (!exp) return null;   // a wall cell in an interior: air
  return facade(x, z, y, f);
}

// the facade of a storey row: stone piers and a basalt base at street level, a sill and white piers above, glass between
function facade(x, z, y, f) {
  const k = Math.floor(y / 4), r = y % 4;
  const along = f.includes("W") || f.includes("E") ? z : x;
  const corner = f.length >= 2;
  const pier = corner || along % 3 === 0;
  if (k === 0) {
    if (x === DOOR[0] && Math.abs(z - DOOR[1]) === 0 && r <= 2) return r === 1 ? ["oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" }]
      : ["oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (x === DOOR[0] && z === DOOR[1] && r === 3) return ["stone_bricks"];   // the lintel over the door
    if (pier || (x === DOOR[0] && Math.abs(z - DOOR[1]) === 1)) return ["stone_bricks"];
    return ["light_blue_stained_glass_pane", pane(f)];
  }
  if (r === 1) return pier ? ["white_concrete"] : ["light_gray_concrete"];   // the sill row, and the pier's foot
  if (pier) return ["white_concrete"];
  return ["light_blue_stained_glass_pane", pane(f)];
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  // the foundation: solid from the lowest ground (0) up to this cell's first storey, nothing under it
  for (let y = 0; y < H; y++) {
    const b = blockAt(x, z, y);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

// lit windows: a glowstone on the floor just inside the glass, in some windows of the upper storeys
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  for (let k = 1; k * 4 < H; k++) {
    const y = k * 4 + 2;
    if (!B.has(`${x},${y},${z}`)) continue;
    const f = faces(x, z, y);
    if (f.length !== 1 || hash(x, k, z) % 6 !== 0) continue;
    const [dx, dz] = DIRS[f[0]], ix = x - dx, iz = z - dz;   // one cell in, against the glass
    if (!inside(ix, iz) || B.has(`${ix},${k * 4 + 1},${iz}`)) continue;
    put(ix, k * 4 + 1, iz, hash(x, k, z) % 12 === 0 ? "shroomlight" : "glowstone");
  }
}

// roof units on the body's top: 2 x 2 plant boxes on the untiered roof, clear of the edge and the core
for (let x = 1; x < W - 2; x += 1) for (let z = 1; z < D - 2; z += 1) {
  const cells4 = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => [x + a, z + b]);
  if (!cells4.every(([a, b]) => inside(a, b) && TIER[a][b] === "body" && !edge(a, b))) continue;
  if (hash(x, 17, z) % 37 !== 0) continue;
  for (const [a, b] of cells4) { put(a, 17, b, "light_gray_concrete"); put(a, 18, b, "light_gray_concrete"); }
  put(x, 19, z, "iron_bars");   // a grille on the unit's top
}

const g = new Voxels([W, H, D]);
for (const [key, { b, s }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340889.nbt";
const stats = g.save(out);
console.log(`way_326340889: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
