// Bank Buildings (way 162320314): a 1920s Stripped Classical bank and office block, five storeys over a basalt plinth, the
// usual Auckland mix of its decade: red brick piers, cream stone bands (Oamaru-style dressings), Auckland volcanic
// (andesite) base course, quoins at the corners, a stone cornice and parapet. The lidar roof (19-22 blocks above the
// lowest ground across most of the footprint) is median-smoothed and snapped to the 4-block storey grid: five storeys
// (roof at 20) over most of the block, four and three storeys at the lower wings. Storey lines are global from y 0, so
// the low north end shows five storeys and the high south end stands four on a plinth. The ground-storey piers are
// basalt, the entrance is on the north face at street level with a dark-oak hood, glowstone glows behind some panes,
// and a small plant room sits on the roof. Interiors are air with a floor slab per storey, behind a sealed shell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162320314.cells.json`, "utf8"));
const W = 16, D = 34, MAXY = 35;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// foundation: solid from y 0 up to the first storey line at or above the ground (a basalt base course where the ground is low)
const base = (x, z) => 4 * Math.ceil(G[x][z] / 4);

// roof: lidar 3x3 median, snapped to the storey grid: 20 = five storeys, 16 = four, 12 = three (lower wings)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof slab y of each cell (a multiple of 4)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  H[x][z] = Math.max(m >= 19 ? 20 : m >= 15 ? 16 : 12, base(x, z) + 4);
}

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= H[nx][nz];
});

const g = new Voxels([W, MAXY, D]);
// glazing panes: a pane on a north or south face joins east and west, on an east or west face north and south
const PANE = (dir) => (dir === "N" || dir === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowCandidates = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const b = base(x, z), top = H[x][z];
  // foundation and basalt base course
  for (let y = 0; y < b; y++) g.set(x, y, z, "andesite");
  for (let y = b; y < top; y++) {
    const k = Math.floor((y - b) / 4), r = (y - b) % 4;
    const ex = exposed(x, z, y);
    const horiz = ex.filter(d => d === "N" || d === "S"), vert = ex.filter(d => d === "E" || d === "W");
    if (r === 0 || r === 3) {
      // floor line (sill) and lintel bands on the face; a floor slab where the storey is interior
      if (ex.length) g.set(x, y, z, "smooth_sandstone");
      else if (r === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!ex.length) continue;                                     // interior air behind the glass
    if (horiz.length && vert.length) { g.set(x, y, z, "smooth_sandstone"); continue; }   // corner quoin
    const face = horiz.length ? horiz[0] : vert[0];
    const u = (face === "N" || face === "S") ? x : z;
    if (u % 3 === 0) { g.set(x, y, z, k === 0 ? "polished_andesite" : "bricks"); continue; }   // pier
    g.set(x, y, z, "glass_pane", PANE(face));
    glowCandidates.push({ x, y, z, face });
  }
  // roof slab over the footprint; a cornice and parapet on the rim, standing on the roof
  g.set(x, top, z, "stone");
  if (exposed(x, z, top).length) {
    g.set(x, top + 1, z, "smooth_sandstone");
    g.set(x, top + 2, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm light: glowstone behind some panes, in the interior air just inside the glass
for (const { x, y, z, face } of glowCandidates) {
  if ((x * 5 + z * 11 + y * 3) % 13 !== 0 || y % 8 !== 1) continue;   // a sparse scatter: about one lit window in thirteen, on every other storey row
  const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || y < base(ix, iz) || y >= H[ix][iz] || exposed(ix, iz, y).length) continue;
  if (g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// the entrance: north face, at street level (ground 0), the middle of the north run; a door, glazed flanks, a dark-oak hood
const ex0 = 9, ez0 = 1;
g.set(ex0, 0, ez0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex0, 1, ez0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [ex0 - 1, ex0 + 1]) {
  g.set(x, 0, ez0, "polished_andesite");
  g.set(x, 1, ez0, "glass_pane", PANE("N"));
}
for (let x = ex0 - 1; x <= ex0 + 1; x++) g.set(x, 2, ez0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// roof plant room: a 3 x 3 stone-brick box on the five-storey roof, two blocks high, a glazed face each side
const PX = [9, 10, 11], PZ = [14, 15, 16];
if (PX.every(x => PZ.every(z => inside(x, z) && H[x][z] === 20))) {
  for (const x of PX) for (const z of PZ) {
    const edge = x !== 10 || z !== 15, mid = (x === 10) !== (z === 15);   // corners and sides; a side's centre takes a window
    if (!edge) continue;
    if (mid) g.set(x, 21, z, "glass_pane", PANE(z === 14 || z === 16 ? "N" : "E"));
    else g.set(x, 21, z, "stone_bricks");
  }
  for (const x of PX) for (const z of PZ) g.set(x, 22, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const { blocks, palette } = g.save(`${DIR}/way_162320314.nbt`);
console.log(`way_162320314: ${blocks} blocks, palette ${palette}`);
