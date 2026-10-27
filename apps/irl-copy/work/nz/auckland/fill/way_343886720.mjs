// Auckland office block (way 343886720): a 1970s-80s concrete-frame office on a basalt plinth, six storeys over a
// seventh-storey core with a plant room. Lidar roof heights are median-smoothed and snapped to the 4-block storey grid:
// a 24 podium (most of the footprint), a 28 core where the lidar reads 27+ and more than 5 blocks in from the edge, a
// 30 plant room on the core's middle, an 8 low wing at the north-west corner. Facade: a white floor line each storey,
// tinted glass ribbon in white concrete piers (corner columns solid), light-grey spandrels, a dark-oak shopfront on the
// ground floor with a deepslate plinth, a recessed three-wide entrance porch with a dark-oak door and hanging lanterns,
// glowstone behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886720.cells.json", "utf8"));
const W = 53, D = 34, H = 43;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, then flat tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // top of each column (the cap block sits at y = T)
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  let t = r >= 27 ? 28 : r >= 15 ? 24 : 8;
  if (t === 28 && d >= 8 && r >= 29) t = 30;                   // plant room on the middle of the core
  T[x][z] = Math.max(t, 4 * Math.ceil((G[x][z] + 4) / 4));   // at least one storey above the ground under it
  tiers[T[x][z]] = (tiers[T[x][z]] || 0) + 1;
}

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// faces of a cell exposed at height y: outside the footprint, or beside a column that stops below y
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || T[nx][nz] <= y; });

// the entrance: the longest run of street-front cells (exposed, on the podium or higher) on any side; door at its middle
const runs = [];
for (const [k, dx, dz] of DIRS) {
  const ns = k === "N" || k === "S";
  const line = new Map();                                     // position across the face -> cells on that line
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!inside(x, z) || T[x][z] < 24 || !exposed(x, z, 1).some(e => e[0] === k)) continue;
    const key = ns ? z : x, along = ns ? x : z;
    if (!line.has(key)) line.set(key, []);
    line.get(key).push(along);
  }
  for (const [key, alongs] of line) {
    alongs.sort((a, b) => a - b);
    let start = alongs[0], prev = alongs[0];
    const close = () => { if (prev - start + 1 >= 3) runs.push({ k, key, start, end: prev, len: prev - start + 1 }); };
    for (const a of alongs.slice(1)) { if (a === prev + 1) prev = a; else { close(); start = prev = a; } }
    close();
  }
}
runs.sort((a, b) => b.len - a.len);
const best = runs[0];
const porch = new Map();                                       // "x,z" -> { k, door } for the three perimeter cells of the porch
let entrance = null;
if (best) {
  const mid = Math.floor((best.start + best.end) / 2);
  const [, dx, dz] = DIRS.find(([k]) => k === best.k);         // outward
  const ns = best.k === "N" || best.k === "S";
  entrance = { k: best.k, dx, dz, door: ns ? [mid, best.key] : [best.key, mid] };
  for (let s = -1; s <= 1; s++) {
    const p = ns ? [mid + s, best.key] : [best.key, mid + s];
    porch.set(p.join(","), { k: best.k, door: s === 0, inner: [p[0] - dx, p[1] - dz] });
  }
}

const g = new Voxels([W, H, D]);
// a pane, or an iron bar, joins the neighbours along the face it sits in
const paneState = (k) => (k === "N" || k === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lit = (x, y, z) => (x * 31 + z * 17 + y * 7) % 9 === 0;   // a warm room behind about one pane in nine
const lanterns = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], t = T[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < t; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === 0) g.set(x, y, z, "stone_bricks");
      else if (y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const pc = porch.get(`${x},${z}`);
    if (pc && y >= 1 && y <= 2) {
      if (pc.door) g.set(x, y, z, "dark_oak_door", { facing: pc.k === "N" ? "north" : pc.k === "S" ? "south" : pc.k === "E" ? "east" : "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;                                                // the porch opening, air beside the door
    }
    if (y === 0) { g.set(x, y, z, "deepslate_bricks"); continue; }   // basalt plinth
    const corner = ex.length >= 2;
    const along = ex[0][0] === "N" || ex[0][0] === "S" ? x : z;
    const storey0 = y < 4;
    const top = t === 30;                                     // the plant room: louvres, not glass
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }                    // floor line
    if (y % 4 === 3) { g.set(x, y, z, storey0 ? "white_concrete" : "light_gray_concrete"); continue; }   // fascia / spandrel
    if (corner || along % 3 === 0) { g.set(x, y, z, storey0 ? "dark_oak_planks" : "white_concrete"); continue; }   // piers
    if (top) { g.set(x, y, z, along % 2 ? "iron_bars" : "light_gray_concrete", paneState(ex[0][0])); continue; }   // louvres
    g.set(x, y, z, "light_blue_stained_glass_pane", paneState(ex[0][0]));
    if (lit(x, y, z)) {                                       // a lamp in the room behind the glass
      const [, dx, dz] = ex[0];
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && T[ix][iz] > y && exposed(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
  }

  // roof: a flat cap on the column, a parapet on the outside ring of the podium and the core
  if (t <= 30) g.set(x, t, z, "gray_concrete");
  if (d === 1 && (t === 24 || t === 28)) g.set(x, t + 1, z, "white_concrete");
  // roof plant: small boxes on the podium terrace
  if (t === 24 && d >= 3 && x % 7 === 3 && z % 7 === 3) { g.set(x, t + 1, z, "light_gray_concrete"); g.set(x, t + 2, z, "light_gray_concrete"); }
}

// the porch: a ceiling-level lantern hung in each inner corner of the recess
if (entrance) for (const [key, pc] of porch) {
  if (pc.door) continue;
  const [ix, iz] = pc.inner;
  if (inside(ix, iz)) lanterns.push([ix, 3, iz]);
}
for (const [x, y, z] of lanterns) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
// the porch ceiling: the storey floor above the recess, one row deep
if (entrance) for (const [key, pc] of porch) {
  const [ix, iz] = pc.inner;
  if (inside(ix, iz)) g.set(ix, 4, iz, "smooth_stone");
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886720.nbt");
console.log(JSON.stringify({ cells: cells.length, tiers, entrance: entrance && entrance.door, saved: info }));
