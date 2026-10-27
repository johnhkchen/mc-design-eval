// Waterloo Towers, Auckland (way 319666778): a 1980s concrete-frame tower on a basalt plinth, the lidar's roof read as
// a 16-storey block at the west end stepping down to 3-storey wings to the east. Roof heights are 3x3-median-smoothed,
// snapped to the 4-block storey grid and given their modal neighbour tier, so the setbacks are flat tiers. Each cell
// stands on the ground under it (a solid core, so nothing floats), and only the facade is articulated: a basalt base
// course, white concrete piers and storey lines, tinted light-blue glass with light-grey head spandrels, a cornice, and
// a recessed-looking dark-oak entrance under a canopy band. Glass sits one block proud of an air pocket with a
// glowstone or lantern in some; the roof has a few plant boxes on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_319666778.cells.json", "utf8"));
const W = 37, D = 23, H = 78;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof tiers: 3x3 median of the lidar, snapped to 4 blocks (at least two storeys), then the modal tier of the neighbourhood
const med = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) snap[x][z] = Math.max(8, Math.round(med(x, z) / 4) * 4);
const T = Array.from({ length: W }, () => Array(D).fill(0));    // roof level (top block is T - 1)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const counts = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
    const s = snap[x + dx][z + dz]; counts.set(s, (counts.get(s) || 0) + 1);
  }
  let best = snap[x][z], bestN = -1;
  for (const [s, n] of counts) if (n > bestN || (n === bestN && s > best)) { best = s; bestN = n; }
  T[x][z] = Math.max(best, Math.ceil((G[x][z] + 8) / 4) * 4);   // never lower than two storeys over its own ground
}
const top = (x, z) => (inside(x, z) ? T[x][z] : 0);

const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the faces of a cell at height y that are open to air: outside the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIR).filter(d => {
  const [dx, dz] = DIR[d];
  return top(x + dx, z + dz) <= y;
});

const v = new Voxels([W, H, D]);
const tallest = Math.max(...T.flat());

// solid core to each roof, then the facade on every exposed cell above its ground
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (let y = 0; y < T[x][z]; y++) v.set(x, y, z, "gray_concrete");
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const g = G[x][z], t = T[x][z];
  for (let y = g; y < t; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) continue;
    // a stepped (diagonal) edge has a riser on nearly every row, each open to two sides: it takes its east/west face,
    // so the riser stays on the window grid rather than turning to a run of corner piers
    const face = ["E", "W", "N", "S"].find(d => ex.includes(d)), along = face === "N" || face === "S" ? x : z;
    const pier = along % 3 === 0;
    const o = y % 4;
    let block;
    if (y === t - 1) block = "polished_andesite";              // cornice / parapet course
    else if (y < 4) block = "polished_basalt";                 // base course on the ground
    else if (o === 0 || pier) block = "white_concrete";        // storey line and piers
    else if (o === 3) block = "light_gray_concrete";           // head spandrel under the glass
    else block = "light_blue_stained_glass";
    v.set(x, y, z, block);
    if (block !== "light_blue_stained_glass") continue;
    // the air pocket behind the pane, and a warm light in some of them
    const [dx, dz] = DIR[face], ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || T[ix][iz] <= y || exposed(ix, iz, y).length) continue;
    const k = (x * 7 + z * 3 + y * 5) % 9;
    if (o === 1 && k === 0) v.set(ix, y, iz, "glowstone");
    else if (o === 2 && k === 4) v.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
    else v.set(ix, y, iz, "air");
  }
}

// entrance: a glass-bay-free cell on the north face nearest the middle, doors over the ground, a dark-oak canopy band
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || inside(x, z - 1) || !inside(x - 1, z) || !inside(x + 1, z)) continue;
  if (door === null || Math.abs(x - 18) < Math.abs(door[0] - 18)) door = [x, z];
}
if (door) {
  const [x, z] = door, g = G[x][z];
  const facing = "north";
  v.set(x, g, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let dx = -1; dx <= 1; dx++) v.set(x + dx, g + 2, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// plant boxes on the tallest tier's roof, each standing on the roof block below
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || T[x][z] !== tallest || exposed(x, z, T[x][z] - 1).length) continue;
  if (x % 8 !== 4 || z % 6 !== 3) continue;
  v.set(x, T[x][z], z, "light_gray_concrete");
  v.set(x, T[x][z] + 1, z, "light_gray_concrete");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_319666778.nbt";
const stats = v.save(out);
console.log(`way_319666778: ${stats.blocks} blocks, ${stats.palette} palette entries, tallest roof y ${tallest}`);
