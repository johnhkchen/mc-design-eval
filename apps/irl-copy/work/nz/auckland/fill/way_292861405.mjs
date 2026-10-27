// Way 292861405, Auckland (Eden Terrace side of Maungawhau): a 1980s-style reinforced-concrete office tower, 14 storeys
// over a basalt base. Lidar roofs (median-smoothed) snap to a 4-block storey grid: a tower core at 56 (its roof about 55
// above the lowest ground), a 48 setback ring and wings, and noise-level cells held to two storeys or more. Walls stand on
// their own columns (foundation to the 4-block ground line, floor slabs every storey, a roof slab on each cell), so nothing
// hangs. The facade is a white concrete frame: floor lines, piers every third block, light-blue glass panes with a
// spandrel band, quoins at the corners, glowstone behind some windows, a recessed entrance on the south face and roof
// plant on the core. Interiors are air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861405.cells.json", "utf8"));
const W = 30, D = 28, Y = 67;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell (-1 = not footprint)
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// distance in cells from the outside edge (1 = on the rim)
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, then the tiers: tower core, setback ring, lower wings; never under two storeys
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // absolute top of each cell's mass
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z), d = dist[x][z];
  let t = m >= 50 && d >= 4 ? 56 : m >= 38 ? 48 : 4 * Math.round(m / 4);
  t = Math.max(t, 4 * Math.ceil((G[x][z] + 8) / 4), 8);   // storey lines stay on the 4-block grid
  T[x][z] = t; tiers[t] = (tiers[t] || 0) + 1;
}
console.log("tops", JSON.stringify(tiers));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// the outward faces of a cell at height y that show air (outside the footprint or beside a shorter neighbour)
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || T[nx][nz] <= y; });

// the entrance: a ground-level rim cell on the south face nearest the middle of the footprint
let cx = 0, n = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) { cx += x; n++; }
cx /= n;
let door = null;
for (let x = 0; x < W; x++) {
  if (!inside(x, D - 1) && !inside(x, D)) continue;
  if (!inside(x, D - 1) || G[x][D - 1] > 0) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door - cx)) door = x;
}
if (door === null) for (let x = 0; x < W; x++) if (inside(x, 0) && G[x][0] === 0) { door = x; break; }
const doorZ = door !== null && inside(door, D - 1) ? D - 1 : 0;
const doorFacing = doorZ === D - 1 ? "north" : "south";

const warm = (x, y, z) => y >= 4 && (x * 7 + y * 13 + z * 3) % 17 === 0;
const glass = (along) => ({ block: "light_blue_stained_glass_pane", state: along === "x" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } });
const pane = (x, y, z, along) => (warm(x, y, z) ? { block: "glowstone" } : glass(along));

// the wall block for an exposed cell at height y, from the face(s) it shows
function facade(x, z, y, ex) {
  if (ex.length >= 2) return { block: "white_concrete" };                          // corners: quoins
  const [face] = ex[0];
  const along = face === "N" || face === "S" ? "x" : "z";
  const u = along === "x" ? x : z;
  const r = y % 4;
  if (y === T[x][z] - 1) return { block: "white_concrete" };                       // cornice
  if (y < 4) {                                                                      // basalt base and shopfront
    if (y === 0) return { block: "polished_basalt" };
    if (y === 3) return { block: "white_concrete" };
    return u % 3 === 0 ? { block: "white_concrete" } : pane(x, y, z, along);
  }
  if (r === 0) return { block: "white_concrete" };                                 // floor line
  if (r === 3) return { block: "light_gray_concrete" };                            // spandrel
  return u % 3 === 0 ? { block: "white_concrete" } : pane(x, y, z, along);
}

const g = new Voxels([W, Y, D]);
const put = (x, y, z, b) => { if (b) g.set(x, y, z, b.block, b.state); };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], top = T[x][z], foundation = gr === 0 ? 1 : 4;
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y < foundation) { put(x, y, z, { block: "polished_basalt" }); continue; }        // solid up to the ground line
    if (ex.length) {
      if (x === door && z === doorZ && (y === 1 || y === 2)) {                          // the recessed entrance
        put(x, y, z, { block: "dark_oak_door", state: { facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
        continue;
      }
      if (x === door && z === doorZ && y === 3) { put(x, y, z, { block: "white_concrete" }); continue; }
      put(x, y, z, facade(x, z, y, ex));
      continue;
    }
    if (y === 0 || y === top - 1) { put(x, y, z, { block: y === 0 ? "light_gray_concrete" : "gray_concrete" }); continue; }   // floor, roof
    if (y % 4 === 0) put(x, y, z, { block: "light_gray_concrete" });                  // a slab per storey
  }
}
// parapets on the rim, one block above each tier's roof
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1) {
  put(x, T[x][z], z, { block: "white_concrete" });
}
// roof plant: a lift core on the tower's centre, air-handling units on the setback terraces
const coreCells = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === 56 && dist[x][z] >= 6) coreCells.push([x, z]);
const cxs = coreCells.map(c => c[0]), czs = coreCells.map(c => c[1]);
const cMin = [Math.min(...cxs), Math.min(...czs)], cMax = [Math.max(...cxs), Math.max(...czs)];
const midX = (cMin[0] + cMax[0]) >> 1, midZ = (cMin[1] + cMax[1]) >> 1;
for (let x = midX - 2; x <= midX + 1; x++) for (let z = midZ - 2; z <= midZ + 1; z++) if (inside(x, z) && T[x][z] === 56) {
  for (let y = 56; y < 60; y++) put(x, y, z, { block: y === 59 ? "light_gray_concrete" : "smooth_stone" });
}
let ac = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === 48 && dist[x][z] >= 3 && (x + z) % 7 === 0 && ac < 6) {
  if (inside(x + 1, z) && T[x + 1][z] === 48) { put(x, 48, z, { block: "iron_block" }); put(x + 1, 48, z, { block: "iron_block" }); ac++; }
}

console.log("saved", g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861405.nbt"));
