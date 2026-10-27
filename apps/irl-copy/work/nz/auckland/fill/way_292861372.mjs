// Way 292861372, Auckland (Tāmaki Makaurau): a 1990s glass-and-concrete office complex. A broad eight-storey podium
// (lidar roof 32-35, snapped to 32) carries a 22-storey glass tower (roof 88-96) set in the west-centre of the footprint.
// Lidar roof heights are median-smoothed and snapped to a 4-block storey grid; tiers with only a few cells fold into the
// nearest common tier, so the massing is flat slabs, not lidar noise. Foundations are basalt-grey plinth from y 0 up to
// each cell's ground, so nothing floats on the slope. Storey lines sit on the absolute 4-block grid, so floors line up
// across the terrace. The outer ring carries the facade: a granite base course, a clear-glass shopfront on the ground
// storey (lintel above), then per storey a white string course, a light-grey spandrel and two rows of tinted glass
// between white piers, with a stone cornice at the top. The tower's flanks above the podium are facade too. A dark-oak
// entrance sits on the north face with a lintel canopy; glowstone shows behind some panes. Interiors are air with a
// floor slab per storey and a roof deck; roof plant pods stand on the podium and tower tops.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861372.cells.json", "utf8"));
const W = 133, D = 94, Y = 109;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, snapped to the 4-block storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));
const hist = new Map();
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const t = 4 * Math.round(median(x, z) / 4);
  T[x][z] = t; hist.set(t, (hist.get(t) || 0) + 1);
}
// tiers with only a few cells fold into the nearest common tier (the lidar's noise, not a storey)
const kept = [...hist].filter(([, n]) => n >= 60).map(([t]) => t);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!kept.includes(T[x][z])) T[x][z] = kept.reduce((a, b) => (Math.abs(b - T[x][z]) < Math.abs(a - T[x][z]) ? b : a));
  T[x][z] = Math.max(T[x][z], G[x][z] + 8);                // at least two storeys above the ground
}

// a column's side is exposed where a footprint neighbour's roof has dropped below this height (a tower's flank)
const exposed = (x, z, y) => dist[x][z] === 1 || NB.some(([dx, dz]) => inside(x + dx, z + dz) && y >= T[x + dx][z + dz] && y >= G[x + dx][z + dz]);

// the entrance: the north face (lowest z in its column) across the middle of the footprint
const doorCells = [];
for (let x = 56; x <= 76; x++) {
  let zn = -1; for (let z = 0; z < D; z++) if (inside(x, z)) { zn = z; break; }
  if (zn >= 0 && dist[x][zn] === 1 && G[x][zn] <= 6) doorCells.push([x, zn]);
}
const doorSpan = doorCells.slice(0, 3);                        // a three-cell entrance, from the first cells found
const doorAt = new Set(doorSpan.map(([x, z]) => `${x},${z}`));

const vox = new Voxels([W, Y, D]);
const put = (x, y, z, b, s) => vox.set(x, y, z, b, s);
const PLINTH = "polished_andesite", SLAB = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const PIER = "white_concrete", SPANDREL = "light_gray_concrete", STRING = "white_concrete", CORNICE = "smooth_stone";
const BASE = "polished_granite", SHOP = "glass", LINTEL = "smooth_stone";

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const g = G[x][z], t = T[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y < g; y++) put(x, y, z, PLINTH);
  const groundTop = 4 * Math.floor(g / 4) + 4;                  // the first storey line above the ground
  const shop = d === 1;                                       // a shopfront on every face of the ring
  for (let y = g; y < t; y++) {
    const line = y % 4 === 0;
    const ext = exposed(x, z, y);
    if (y === t - 1) {                                        // roof: a stone cornice on the ring, a deck inside
      put(x, y, z, ext ? CORNICE : SLAB);
      continue;
    }
    if (!ext) {                                               // interior: a floor slab per storey, air between
      if (line && y > g) put(x, y, z, SLAB);
      else if (d === 2 && y % 4 === 2 && (x * 5 + z * 3 + y) % 11 === 0) put(x, y, z, "glowstone");   // warm light behind the glass
      continue;
    }
    const pier = (x + z) % 3 === 0;
    if (y === g) { put(x, y, z, BASE); continue; }            // base course on the ground
    if (shop && y < groundTop) {                              // shopfront storey
      if (doorAt.has(`${x},${z}`) && (y === g + 1 || y === g + 2)) {
        const half = y === g + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else if (doorSpan.some(([dx, dz]) => dx === x && dz === z) && y === g + 3) {
        put(x, y, z, BASE);                                   // canopy lintel over the entrance
      } else if (y === groundTop - 1) put(x, y, z, LINTEL);
      else put(x, y, z, pier ? PIER : SHOP);
      continue;
    }
    if (line) { put(x, y, z, STRING); continue; }
    const r = y % 4;
    if (r === 1) { put(x, y, z, SPANDREL); continue; }
    if (shop && y % 8 === 2 && (x * 3 + z) % 17 === 0) put(x, y, z, "shroomlight"); // a few warm panes
    else put(x, y, z, pier ? PIER : GLASS);                   // glass between piers (tower flanks read the same)
  }
}

// roof plant: pods on the podium and the tower top, standing on the roof deck
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] < 4) continue;
  const t = T[x][z];
  if (x % 9 !== 3 || z % 9 !== 3) continue;
  const h = t >= 80 ? 3 : 2;
  for (let y = t; y < t + h; y++) put(x, y, z, SLAB);
  put(x, t + h, z, CORNICE);                                // a stone cap (iron bars read as tall spikes at this scale)
}

const rep = vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861372.nbt");
console.log(`tiers ${[...kept].sort((a, b) => a - b).join(",")}; ${rep.blocks} blocks, ${rep.palette} palette`);
