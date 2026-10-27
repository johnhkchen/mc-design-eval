// Auckland way 154430134, Newton side below Mt Eden: a 1970s concrete-frame office tower. Lidar roof tiers quantise to
// 12-block wings, a 28 podium, a 40 setback and a 44 tower with a 48 crown (11 to 12 storeys of 4 blocks). Basalt plinth
// (the city's volcanic stone) to the cell's ground; light precast spandrels and piers every third bay, grey tinted glass
// between; a clear shopfront band on the ground storey; a two-door lobby on the lowest street face under a canopy with a
// lantern; a plant room with louvres and a lightning-rod mast on the crown. Floor slabs at every floor line and a concrete
// column grid hold up the air gap behind the glass; glowstone and shroomlight sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430134.cells.json", "utf8"));
const W = 40, D = 38, TOP = 64;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // G: ground under the cell (-1 = not footprint); R: lidar roof above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const BAY = { N: "x", S: "x", E: "z", W: "z" };                 // a north or south face runs along x, so its bays count x
const near = (x, z) => { const out = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) out.push([x + dx, z + dz]); return out; };
const median = (a) => [...a].sort((p, q) => p - q)[a.length >> 1];
const mode = (a) => { const n = new Map(); for (const v of a) n.set(v, (n.get(v) || 0) + 1); let best = a[0]; for (const [v, c] of n) if (c > n.get(best)) best = v; return best; };

// 1. lidar roof: a zero reading (a gap in the survey) takes its neighbours' median, then a 3x3 median
const R1 = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const ok = near(x, z).map(([a, b]) => R[a][b]).filter((r) => r > 0);
  R1[x][z] = R[x][z] > 0 ? R[x][z] : median(ok.length ? ok : [12]);
}
// 2. quantise to storey tiers (multiples of 4), then a mode filter so each setback is one flat patch, not speckle
const TIER = (r) => (r < 20 ? 12 : r < 32 ? 28 : r < 42 ? 40 : r < 46.5 ? 44 : 48);
const T0 = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T0[x][z] = TIER(median(near(x, z).map(([a, b]) => R1[a][b])));
const H = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) H[x][z] = mode(near(x, z).map(([a, b]) => T0[a][b]));

// edge distance (1 on the outside ring), by BFS through the footprint
const dist = grid(0); const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// a face is exposed at height y when the cell beside it is outside the footprint or stands lower than y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => { const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz; return !inside(nx, nz) || H[nx][nz] <= y; });
// a parapet runs round a tier's top wherever it meets open air or a lower tier
const parapetDirs = (x, z) => Object.keys(DIRS).filter((k) => { const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz; return !inside(nx, nz) || H[nx][nz] < H[x][z]; });
const isColumn = (x, z) => x % 6 === 0 && z % 6 === 0 && dist[x][z] >= 3 && inside(x, z);

// 3. the entrance: the street face is the one whose ground-storey wall stands lowest, and the lobby takes the middle bays
let street = null;
for (const k of Object.keys(DIRS)) {
  const cs = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] >= 12 && G[x][z] <= 1 && exposed(x, z, 1).includes(k)) cs.push([x, z]);
  if (cs.length < 6) continue;
  const mean = cs.reduce((s, [x, z]) => s + G[x][z], 0) / cs.length;
  if (!street || mean < street.mean) street = { k, cs, mean };
}
const lobby = new Set();                                          // the two door bays on the street face
if (street) {
  const bay = (x, z) => (BAY[street.k] === "x" ? x : z);
  const sorted = street.cs.map(([x, z]) => [bay(x, z), x, z]).sort((a, b) => a[0] - b[0]);
  const mid = sorted[sorted.length >> 1][0];
  for (const [b, x, z] of sorted) if (b === mid || b === mid + 1) lobby.add(`${x},${z}`);
}
const lobbyDoor = (x, z, y) => street && lobby.has(`${x},${z}`) && (y === 1 || y === 2);

// 4. crown plant room: the crown cells well in from the edge, a louvred box with a roof and a mast
const crown = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 48 && dist[x][z] >= 4) crown.push([x, z]);
const plant = new Set();
let mast = null;
if (crown.length) {
  const cx = Math.round(crown.reduce((s, [x]) => s + x, 0) / crown.length), cz = Math.round(crown.reduce((s, [, z]) => s + z, 0) / crown.length);
  for (const [x, z] of crown) if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) plant.add(`${x},${z}`);
  mast = [cx, cz];
}
const inPlant = (x, z) => plant.has(`${x},${z}`);
const plantEdge = (x, z) => !inPlant(x - 1, z) || !inPlant(x + 1, z) || !inPlant(x, z - 1) || !inPlant(x, z + 1);

// the facade of one exterior cell at height y: spandrel row, two glass rows, a lintel row; piers at corners and every third bay
const pane = (axisX, shop) => ({ north: axisX ? "false" : "true", south: axisX ? "false" : "true", east: axisX ? "true" : "false", west: axisX ? "true" : "false", waterlogged: "false" });
const lamps = [];
const CONCRETE = "light_gray_concrete";

const g = new Voxels([W, TOP, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z];
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y < gr) { g.set(x, y, z, "polished_basalt"); continue; }          // foundation to the ground, plinth on the faces
    if (ex.length) {
      const k = ex[0];
      const corner = ex.some((d) => BAY[d] === "x") && ex.some((d) => BAY[d] === "z");
      const bay = BAY[k] === "x" ? x : z;
      const row = y % 4;                                                  // ground storey: 0 plinth, 1-2 shopfront, 3 fascia
      const ground = y < 4;
      if (ground && row === 0) { g.set(x, y, z, "polished_basalt"); continue; }
      if (row === 3 || corner || bay % 3 === 0) { g.set(x, y, z, CONCRETE); continue; }
      if (row === 0 && !ground) { g.set(x, y, z, CONCRETE); continue; }  // spandrel
      if (lobbyDoor(x, z, y) && street.k === k) {                        // the two lobby doors
        g.set(x, y, z, "dark_oak_door", { facing: OPP[k] === "N" ? "north" : OPP[k] === "S" ? "south" : OPP[k] === "E" ? "east" : "west",
          half: y === 1 ? "lower" : "upper", hinge: bay % 2 === 0 ? "left" : "right", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, ground ? "glass_pane" : "gray_stained_glass_pane", pane(BAY[k] === "x", ground));
      // a lamp in the room behind this pane, now and then
      const [dx, dz] = DIRS[k], cx = x - dx, cz = z - dz;
      if (row === 1 && inside(cx, cz) && !isColumn(cx, cz) && !exposed(cx, cz, y).length && H[cx][cz] > y && (x * 7 + z * 13 + y) % 6 === 0) lamps.push([cx, y, cz, (x * 3 + z) % 11 === 0 ? "shroomlight" : "glowstone"]);
      continue;
    }
    if (isColumn(x, z) || y % 4 === 0) { g.set(x, y, z, CONCRETE); continue; }   // column grid and a floor slab per storey
    if (y === top - 1) g.set(x, y, z, "smooth_stone");                  // the roof surface
  }
  if (top >= 12 && parapetDirs(x, z).length) g.set(x, top, z, CONCRETE);  // parapet round a tier
}

// the lobby canopy over the door bays, a lantern hung under it
if (street) {
  const [dx, dz] = DIRS[street.k];
  for (const key of lobby) {
    const [x, z] = key.split(",").map(Number);
    g.set(x, 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz)) { g.set(ix, 3, iz, "stone_brick_slab", { type: "top", waterlogged: "false" }); g.set(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" }); }
  }
}

// the plant room: louvred walls, a roof, and a lightning-rod mast
for (const key of plant) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 48; y < 51; y++) {
    if (plantEdge(x, z)) g.set(x, y, z, y === 49 && (x + z) % 2 === 0 ? "iron_bars" : CONCRETE, y === 49 && (x + z) % 2 === 0 ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
    else g.set(x, y, z, "air");
  }
  g.set(x, 51, z, "smooth_stone");
}
if (mast) for (let y = 52; y < 58; y++) g.set(mast[0], y, mast[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

for (const [x, y, z, b] of lamps) g.set(x, y, z, b);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430134.nbt";
console.log(g.save(out));
