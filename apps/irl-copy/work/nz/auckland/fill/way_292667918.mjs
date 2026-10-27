// Hobson Towers West, Auckland (way 292667918): a 1980s-90s office tower on a basalt plinth, twelve storeys over a
// four-storey podium with an eight-storey setback ring. Lidar roofs are median-smoothed and snapped to a 4-block storey
// grid: a 48 crown on the core (median 40 and up), wings at 8-32. Setbacks follow the footprint's edge distance: podium
// to 16 within 3 cells of the edge, the ring to 32 at 4-5 cells, the tower to 48 inside. The facade is a 4-block storey
// rhythm (white floor lines, light-blue glass panes between white piers, light-grey spandrels, a smooth-quartz cornice),
// deepslate piers and base course at street level, a dark-oak entrance on the north side with a black canopy and lanterns.
// Structural white columns on a 6-block grid carry the floor slabs; interiors are air with a slab per storey; glowstone
// sits behind some panes; a lift core and plant boxes on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667918.cells.json", "utf8"));
const W = 26, D = 34, TOP = 60;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
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

// median-smoothed roof, snapped to the storey grid; the setback by edge distance caps it
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (m) => (m >= 40 ? 48 : Math.max(8, Math.round(m / 4) * 4));
const setback = (d) => (d <= 3 ? 16 : d <= 5 ? 32 : 48);
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = Math.min(setback(dist[x][z]), tierOf(median(x, z)));
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
const isFloor = (y, gr) => y === gr || y % 4 === 0;

// the entrance: the middle of the street-level run on the north edge (ground 0, outside ring)
const northRun = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] === 0) northRun.push([x, z]);
const entrance = northRun.length ? northRun[northRun.length >> 1] : null;
const entranceRun = new Set(entrance ? northRun.filter(([x, z]) => z === entrance[1] && Math.abs(x - entrance[0]) <= 1).map(([x, z]) => `${x},${z}`) : []);

const g = new Voxels([W, TOP, D]);
// glass faces on the pane's outward axis: connections run along the wall
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "deepslate_bricks");
  // roof covering: a cornice on the outer ring, a roof slab inside; the parapet caps the crown's outside ring
  g.set(x, top - 1, z, d === 1 ? "smooth_quartz" : "light_gray_concrete");
  if (top === 48 && d === 1) g.set(x, top, z, "white_concrete");

  for (let y = gr; y < top - 1; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (isFloor(y, gr)) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_deepslate"); continue; }      // basalt base course
    if (entranceRun.has(`${x},${z}`) && (y === 1 || y === 2) && y >= gr) {
      if (x === entrance[0] && z === entrance[1]) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
    }
    if (entranceRun.has(`${x},${z}`) && y === 3) { g.set(x, y, z, "black_concrete"); continue; }   // canopy band
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }        // floor line
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }    // spandrel under the floor line
    if (y < 4) { g.set(x, y, z, corner || u % 3 === 0 ? "deepslate_tiles" : "light_blue_stained_glass_pane", PANE(ex)); continue; }
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 5 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// the entrance's lanterns under the canopy, beside the door, hanging from the black band
if (entrance) {
  const [ex, ez] = entrance;
  for (const dx of [-1, 1]) if (entranceRun.has(`${ex + dx},${ez}`)) g.set(ex + dx, 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// structural columns on a 6-block grid inside the ring, through every storey
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] < 3 || x % 6 !== 3 || z % 6 !== 3) continue;
  for (let y = G[x][z]; y < H[x][z] - 1; y++) g.set(x, y, z, "white_concrete");
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0 && g.val(x, y, z) === 0) g.set(x, y, z, "glowstone");

// roof plant on the crown: two plant boxes, and a lift core on the crown's most central spot
const crown = (x, z, m) => { for (let dx = -m; dx <= m; dx++) for (let dz = -m; dz <= m; dz++) if (!inside(x + dx, z + dz) || H[x + dx][z + dz] !== 48 || dist[x + dx][z + dz] < 4) return false; return true; };
let lift = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && crown(x, z, 1) && (!lift || dist[x][z] > dist[lift[0]][lift[1]])) lift = [x, z];
if (lift) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 48; y <= 50; y++) g.set(lift[0] + dx, y, lift[1] + dz, y === 50 ? "smooth_stone_slab" : "light_gray_concrete", y === 50 ? { type: "bottom", waterlogged: "false" } : undefined);
let boxes = 0;
for (let x = 2; x < W - 2 && boxes < 2; x += 3) for (let z = 2; z < D - 2 && boxes < 2; z += 3) {
  if (!crown(x, z, 1) || (lift && Math.abs(x - lift[0]) < 4 && Math.abs(z - lift[1]) < 4)) continue;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) for (let y = 48; y <= 49; y++) g.set(x + dx, y, z + dz, "iron_block");
  boxes++;
}

// the cell's total: a quick check that every solid block is held up by something (below, or a neighbour at its level)
let loose = 0;
g.forEachCell((i) => {
  const X = W, Y = TOP, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  if (g.val(x, y - 1, z)) return;
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.val(x + dx, y, z + dz));
  if (!side) loose++;
});

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292667918.nbt");
console.log(JSON.stringify({ tiers: tierCount, entrance, loose, ...info }));
