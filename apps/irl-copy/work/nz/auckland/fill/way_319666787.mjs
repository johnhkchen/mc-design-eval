// The Connaught, Auckland (way 319666787): read from the lidar record, not from its name. A 1980s-era reinforced-concrete
// tower of about 20 storeys (roof 76-81 blocks above the lowest ground, 4 blocks a storey) on a dark basalt foundation that
// follows the slope. Lidar roofs are median-smoothed within each class and snapped to the storey grid: a crown of 80 at the
// core, a main slab of 76, setback edges of 72, and the low south-east wing (roofs 16-40) as a few-storey podium. The facade
// is a 4-block storey rhythm: a white floor band, glass ribbon with white piers (piers fall on (x - z) % 3 so diagonal walls
// keep their rhythm), light-grey spandrels, a dark-stone base course and a shopfront at ground. Interiors are air with a floor
// slab per storey, and a few glowstones sit behind the glass. Roof: white coping, a plant box and a mast on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_319666787.cells.json", "utf8"));
const W = 51, D = 56, H = 93;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
// [dx, dz, name of the direction]; z grows southward, so dz = -1 is north
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const shell = (x, z) => inside(x, z) && DIRS.some(([dx, dz]) => !inside(x + dx, z + dz));

// Massing: the tower class (roof >= 50) and the low wing; median within a 5x5 window of the same class, then snapped down to
// a storey line (4 blocks) and never below the ground plus three blocks (a storey must stand on the slope it sits on).
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const tower = R[x][z] >= 50, vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (inside(x + dx, z + dz) && (R[x + dx][z + dz] >= 50) === tower) vals.push(R[x + dx][z + dz]);
  }
  const s = median(vals);
  const top = Math.floor(s / 4) * 4;
  T[x][z] = Math.max(top, Math.ceil((G[x][z] + 3) / 4) * 4);
}

// Distance in from the outside (shell = 1), through the footprint, for the penthouse rings.
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (shell(x, z)) { dist[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// Materials
const FOUNDATION = "stone_bricks", PLINTH = "deepslate_tiles", GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete", SPANDREL = "light_gray_concrete", SLAB = "light_gray_concrete", ROOF = "smooth_stone";
const PLANT = "light_gray_concrete", LIGHT = "glowstone";

const g = new Voxels([W, H, D]);
const door = (x, y, z, half, facing) => g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });

// The entrance: the shell cell on the lowest ground (street side), facing out of the footprint.
let entrance = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!shell(x, z)) continue;
  if (!entrance || G[x][z] < G[entrance[0]][entrance[1]]) entrance = [x, z];
}
const [ex, ez] = entrance;
const entranceFacing = DIRS.find(([dx, dz]) => !inside(ex + dx, ez + dz))[2];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z], isShell = shell(x, z);
  const firstFloor = (Math.floor(gr / 4) + 1) * 4;           // the ground storey runs from gr up to this line
  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  for (let y = gr; y < top; y++) {
    if (y === top - 1) {                                       // the roof: coping on the rim, deck inside
      g.set(x, y, z, isShell ? FRAME : ROOF);
      continue;
    }
    if (!isShell) {                                            // interior: a slab per storey line, air between
      if (y % 4 === 0 && y > gr) g.set(x, y, z, SLAB);
      continue;
    }
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }        // base course
    if (y % 4 === 0) { g.set(x, y, z, FRAME); continue; }      // floor line
    const pier = ((x - z) % 3 + 3) % 3 === 0;
    if (pier) { g.set(x, y, z, FRAME); continue; }
    if (y >= firstFloor && y % 4 === 3) { g.set(x, y, z, SPANDREL); continue; }
    g.set(x, y, z, GLASS);
  }
}

// Shell pass 2: the entrance door and a warm light behind some panes (interior cell at the same height, if it is air).
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!shell(x, z)) continue;
  const gr = G[x][z], top = T[x][z];
  for (let y = gr + 1; y < top - 1; y++) {
    if (y % 4 === 0 || (((x - z) % 3 + 3) % 3 === 0)) continue;   // not a pane
    if (y % 4 === 3 && y >= (Math.floor(gr / 4) + 1) * 4) continue; // spandrel
    if (((x * 7 + z * 13 + y * 5) % 11) !== 0 || y % 4 === 3 || y % 4 === 0) continue;
    const inward = DIRS.find(([dx, dz]) => inside(x + dx, z + dz) && !shell(x + dx, z + dz));
    if (!inward) continue;
    const [dx, dz] = inward, nx = x + dx, nz = z + dz;
    if (y >= G[nx][nz] && y < T[nx][nz] - 1) g.set(nx, y, nz, LIGHT);
  }
}
{
  const gr = G[ex][ez];
  door(ex, gr, ez, "lower", entranceFacing);
  door(ex, gr + 1, ez, "upper", entranceFacing);
  g.set(ex, gr + 2, ez, FRAME);                              // lintel over the doorway
}

// Roof plant: a box on the crown's inner cells (4 or more in from the shell), a screen ring at 4, a mast on the cap.
let crown = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || T[x][z] !== 80) continue;
  if (dist[x][z] >= 4) {
    g.set(x, 80, z, PLANT); g.set(x, 81, z, PLANT); g.set(x, 82, z, FRAME);
    if (!crown || dist[x][z] > dist[crown[0]][crown[1]]) crown = [x, z];
  }
}
if (crown) for (let y = 83; y <= 85; y++) g.set(crown[0], y, crown[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_319666787.nbt";
const info = g.save(out);
console.log(`way_319666787: ${info.blocks} blocks, ${info.palette} palette entries; tops ${[...new Set(cells.map(([x, z]) => T[x][z]))].sort((a, b) => a - b).join(",")}; entrance ${ex},${ez} facing ${entranceFacing}`);
