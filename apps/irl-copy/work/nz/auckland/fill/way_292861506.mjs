// Way 292861506, Auckland (Maungawhau view): a 1980s concrete-frame office block, ten to twelve storeys over a basalt
// plinth, the kind that went up along Eden Terrace and the CBD edge. Lidar roof heights are median-smoothed twice and
// snapped to 8-block tiers (a 48 core, 40 and 32 steps, 24 wings, two storeys at the low edges). The facade is a 4-block
// storey rhythm: a white string course at each floor line, two rows of blue-tinted glass between white piers every 3
// blocks, a light-grey spandrel. The ground storey is a glass shopfront on a basalt base course, with a recessed entrance
// (dark-oak door, lintel, hanging lantern). Each setback edge has a white parapet; the top tier carries a plant room and
// the lower tiers carry roof boxes. Interiors are air behind the glass with floor slabs, a ceiling under the roof, a
// column grid and glowstone in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861506.cells.json", "utf8"));
const W = 42, D = 35, TOP = 60;
const G = Array.from({ length: W }, () => Array(D).fill(-1));     // ground under each footprint cell, -1 = outside
let R = Array.from({ length: W }, () => Array(D).fill(0));       // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const key = (x, y, z) => `${x},${y},${z}`;

// 3x3 median over the footprint, applied twice, then snapped to 8-block tiers and at least two storeys above the ground
const median = (A) => Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) => {
  if (!inFP(x, z)) return 0;
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFP(x + dx, z + dz)) v.push(A[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
}));
R = median(median(R));
const H = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) => {
  if (!inFP(x, z)) return 0;
  return Math.max(8 * Math.round(R[x][z] / 8), 4 * Math.ceil((G[x][z] + 8) / 4));
}));
const top = Math.max(...H.flat());

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NAME = { N: "north", S: "south", E: "east", W: "west" };
// the faces of a cell at height y that show air: outside the footprint, or beside a neighbour whose roof is at or below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => { const [dx, dz] = DIRS[k]; return !inFP(x + dx, z + dz) || H[x + dx][z + dz] <= y; });
const firstLine = (g) => 4 * (Math.floor(g / 4) + 1);            // the first floor line above a ground at g

const WHITE = ["white_concrete"], CONC = ["light_gray_concrete"], SLAB = ["light_gray_concrete"], ROOF = ["gray_concrete"];
const pane = (k) => ["light_blue_stained_glass_pane", k === "N" || k === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];

// the wall-face pattern, then the interior: a column grid, floor slabs on the storey lines, a ceiling under the roof,
// a slab under any setback wall that rises from it, and glowstone behind some panes
const lit = new Set();
function block(x, z, y) {
  const Hc = H[x][z], g = G[x][z];
  if (y < g) return ["polished_basalt"];                           // foundation up to the ground
  if (y >= Hc) return null;
  if (y === Hc - 1) return ROOF;                                   // roof deck
  const ex = exposed(x, z, y);
  if (!ex.length) {
    if (x % 6 === 3 && z % 6 === 3) return WHITE;                  // column grid
    if (y === Hc - 2 || (y % 4 === 0 && y > g)) return SLAB;      // ceiling under the roof, floor slab per storey
    if (y < Hc - 2 && exposed(x, z, y + 1).length) return SLAB;   // terrace under a setback wall
    if (lit.has(key(x, y, z))) return ["glowstone"];
    return null;                                                   // air behind the glass
  }
  if (y === g) return ["polished_basalt"];                         // base course
  if (y === Hc - 2) return ["smooth_stone"];                       // cornice
  const k = ex[0];
  const along = k === "N" || k === "S" ? x : z;
  const corner = ex.some(d => "EW".includes(d)) && ex.some(d => "NS".includes(d));
  if (corner || along % 3 === 0) return WHITE;                     // piers
  const ground = y < firstLine(g);
  if (!ground && y % 4 === 0) return WHITE;                        // string course at the floor line
  if (!ground && y % 4 === 3) return CONC;                         // spandrel
  return pane(k);
}

// warm glass: a pane in some windows lights the cell behind it
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z)) {
  for (let y = G[x][z]; y < H[x][z]; y++) {
    const ex = exposed(x, z, y);
    if (ex.length !== 1) continue;
    const b = block(x, z, y);
    if (b && b[0] === "light_blue_stained_glass_pane" && (x * 7 + z * 13 + y * 5) % 6 === 0) {
      const [dx, dz] = DIRS[ex[0]]; lit.add(key(x - dx, y, z - dz));
    }
  }
}

// the overrides: recessed entrance on the face whose ground is lowest, the parapets, the roof boxes and the plant room
const over = new Map();                                            // "x,y,z" -> [block, state], or null for air
const faceCells = { N: [], S: [], E: [], W: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z)) for (const k of Object.keys(DIRS)) {
  const [dx, dz] = DIRS[k]; if (!inFP(x + dx, z + dz)) faceCells[k].push([x, z]);
}
let best = null;
for (const k of Object.keys(faceCells)) {
  const L = faceCells[k]; if (!L.length) continue;
  const lo = Math.min(...L.map(([x, z]) => G[x][z]));
  const score = -lo * 1000 + L.length;
  if (!best || score > best.score) best = { k, lo, score, L };
}
const along = best.k === "N" || best.k === "S" ? 0 : 1;
const low = best.L.filter(([x, z]) => G[x][z] <= best.lo + 1).sort((a, b) => a[along] - b[along]);
const [cx, cz] = low[low.length >> 1];
const [odx, odz] = DIRS[best.k];
const g0 = G[cx][cz];
const door = (half) => ["dark_oak_door", { facing: NAME[best.k], half, hinge: "left", open: "false", powered: "false" }];
const edge = [-1, 0, 1].map(j => (along === 0 ? [cx + j, cz] : [cx, cz + j]));
for (const [ex, ez] of edge) {                                    // the recess: three cells of air, a lintel above
  for (let y = g0; y <= g0 + 2; y++) over.set(key(ex, y, ez), null);
  over.set(key(ex, g0 + 3, ez), CONC);
  const [ix, iz] = [ex - odx, ez - odz];                          // the back wall, one block in
  for (let y = g0; y <= g0 + 2; y++) over.set(key(ix, y, iz), WHITE);
}
const [ix, iz] = [cx - odx, cz - odz];                            // the door in the middle of the back wall
over.set(key(ix, g0, iz), door("lower"));
over.set(key(ix, g0 + 1, iz), door("upper"));
over.set(key(cx, g0 + 2, cz), ["lantern", { hanging: "true", waterlogged: "false" }]);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z)) {
  const h = H[x][z];
  if (exposed(x, z, h).length) over.set(key(x, h, z), WHITE);     // parapet on every edge at roof height
}

// roof boxes on the lower tiers: 2x2 cells of one roof height, clear of the parapet
for (let x = 2; x < W - 2; x += 8) for (let z = 2; z < D - 2; z += 8) {
  const h = H[x][z]; if (h >= top) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([a, b]) => inFP(a, b) && H[a][b] === h && !exposed(a, b, h).length)) continue;
  for (const [a, b] of quad) { over.set(key(a, h, b), CONC); over.set(key(a, h + 1, b), CONC); }
}

// the plant room: a 9 x 5 box on the top tier, clear of its edges, nearest the tier's middle
const topCells = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z) && H[x][z] === top) topCells.push([x, z]);
const mx = topCells.reduce((s, [x]) => s + x, 0) / topCells.length, mz = topCells.reduce((s, [, z]) => s + z, 0) / topCells.length;
let room = null;
for (let x0 = 1; x0 + 9 < W - 1; x0++) for (let z0 = 1; z0 + 5 < D - 1; z0++) {
  let ok = true;
  for (let x = x0 - 1; x <= x0 + 9 && ok; x++) for (let z = z0 - 1; z <= z0 + 5 && ok; z++) ok = inFP(x, z) && H[x][z] === top;
  if (!ok) continue;
  const d = Math.hypot(x0 + 4 - mx, z0 + 2 - mz);
  if (!room || d < room.d) room = { x0, z0, d };
}
if (room) {
  for (let x = room.x0; x < room.x0 + 9; x++) for (let z = room.z0; z < room.z0 + 5; z++) {
    const edgeCell = x === room.x0 || x === room.x0 + 8 || z === room.z0 || z === room.z0 + 4;
    over.set(key(x, top, z), WHITE);
    if (edgeCell) { over.set(key(x, top + 1, z), ["iron_bars"]); over.set(key(x, top + 2, z), WHITE); }
    else { over.set(key(x, top + 2, z), CONC); }
    over.set(key(x, top + 3, z), ROOF);
  }
}

const g = new Voxels([W, TOP, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z)) {
  for (let y = 0; y < TOP; y++) {
    const k = key(x, y, z);
    const b = over.has(k) ? over.get(k) : block(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861506.nbt");
console.log(`way_292861506: top ${top}, ${topCells.length} top-tier cells, plant room ${room ? "yes" : "no"}, ${g.count()} blocks, ${g.palette.length - 1} block states`);
