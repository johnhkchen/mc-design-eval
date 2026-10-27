// Engineering 401 (OSM way 289723272): a concrete-framed faculty tower on a stone plinth, the 1960s-80s campus idiom
// Auckland still has. The massing follows the lidar roof: a stepped tower to the north-east on a lower wing to the
// south-west. Facade: white-concrete piers, light-grey floor slabs and spandrels, blue glass between. Interior is air
// behind the glass, with a floor slab per storey and a solid core that carries the slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_289723272.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_289723272.nbt";
const W = 84, D = 76, H = 61;
const SLAB = 3;                       // floor-slab rows sit at y % 4 == 3; each storey is slab + 3 facade rows

const k = (x, z) => z * W + x;
const foot = new Map();               // k -> { g: ground, r: lidar roof }
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) foot.set(k(x, z), { g, r });
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && foot.has(k(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. Clean the lidar roof: a 5x5 median over footprint cells (noise out), then snap to storey lines so each tier is flat.
const slabAtOrAbove = (g) => g + ((((SLAB - g) % 4) + 4) % 4);
const top = new Map();                // k -> T, the roof-deck row (a slab row); blocks run ground..T
for (const [key, { g, r }] of foot) {
  const x = key % W, z = Math.floor(key / W);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) vals.push(foot.get(k(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const T = Math.min(H - 6, Math.max(SLAB + 4 * Math.round((med - SLAB) / 4), slabAtOrAbove(g) + 4));
  top.set(key, T);
}

// 2. Shell = the walls: a cell with a face to the outside, or to a neighbour on another roof tier.
const shell = new Map();
for (const key of foot.keys()) {
  const x = key % W, z = Math.floor(key / W), T = top.get(key);
  shell.set(key, NB.some(([dx, dz]) => !inF(x + dx, z + dz) || top.get(k(x + dx, z + dz)) !== T));
}

// 3. Core = interior cells at least 3 cells from any shell cell (breadth-first distance inside the footprint).
const dist = new Map();
const queue = [];
for (const [key, s] of shell) if (s) { dist.set(key, 0); queue.push(key); }
for (let i = 0; i < queue.length; i++) {
  const key = queue[i], x = key % W, z = Math.floor(key / W);
  for (const [dx, dz] of NB) {
    if (!inF(x + dx, z + dz)) continue;
    const nk = k(x + dx, z + dz);
    if (!dist.has(nk)) { dist.set(nk, dist.get(key) + 1); queue.push(nk); }
  }
}
const core = (key) => !shell.get(key) && dist.get(key) >= 3;

// 4. Columns: plinth to the ground, storeys to the roof deck, roof coping and roof plant above.
const vox = new Voxels([W, H, D]);
const stats = { shell: 0, core: 0, interior: 0, tiers: new Map() };
for (const [key, { g }] of foot) {
  const x = key % W, z = Math.floor(key / W), T = top.get(key), fs = slabAtOrAbove(g), sh = shell.get(key);
  stats.tiers.set(T, (stats.tiers.get(T) || 0) + 1);
  if (sh) stats.shell++; else if (core(key)) stats.core++; else stats.interior++;
  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");                   // foundation to the cell's own ground
  for (let y = g; y <= T; y++) {
    if (y < fs) vox.set(x, y, z, "smooth_stone"); // base course / plinth under the first floor
    else if (y === T) vox.set(x, y, z, sh ? "white_concrete" : "light_gray_concrete");  // coping on the walls, roof deck inside
    else if (y % 4 === SLAB) vox.set(x, y, z, "light_gray_concrete");              // floor slab / string course
    else if (!sh) { if (core(key)) vox.set(x, y, z, "gray_concrete"); }           // solid core carries the slabs; rest is air
    else if (y % 4 === 2) vox.set(x, y, z, "white_concrete");                      // spandrel under each window band
    else if ((x + z) % 4 === 0) vox.set(x, y, z, "white_concrete");                // pier between window bays
    else vox.set(x, y, z, "light_blue_stained_glass");                             // glazing
  }
}

// 5. Entrance: on the south face (highest z), the door sits in the first storey with a dark canopy over it.
const doorCands = [];
for (const [key] of foot) {
  const x = key % W, z = Math.floor(key / W);
  if (shell.get(key) && !inF(x, z + 1)) doorCands.push([x, z]);
}
doorCands.sort((a, b) => b[1] - a[1]);
const zMax = doorCands[0][1];
const row = doorCands.filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => a - b);
const ex = row[Math.floor(row.length / 2)], ez = zMax;
const efs = slabAtOrAbove(foot.get(k(ex, ez)).g);
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
vox.set(ex, efs + 1, ez, "oak_door", { ...DOOR, half: "lower" });
vox.set(ex, efs + 2, ez, "oak_door", { ...DOOR, half: "upper" });
for (let dx = -2; dx <= 2; dx++) {
  if (inF(ex + dx, ez) && shell.get(k(ex + dx, ez))) vox.set(ex + dx, efs + 3, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// 6. Warm lights behind some panes: a glowstone in the room behind a glazed cell (on the slab below it, so it stands).
let lit = 0;
for (const [key] of foot) {
  const x = key % W, z = Math.floor(key / W);
  if (!shell.get(key)) continue;
  const T = top.get(key), g = foot.get(key).g, fs = slabAtOrAbove(g);
  for (let y = fs + 1; y < T; y++) {
    if (y % 4 !== 0) continue;                                                     // first glazed row of a storey
    if (vox.get(x, y, z)?.block !== "minecraft:light_blue_stained_glass") continue;
    if (((x * 7 + z * 13 + y * 3) % 9) !== 0) continue;
    const inward = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => inF(nx, nz) && !shell.get(k(nx, nz)) && top.get(k(nx, nz)) === T);
    if (!inward) continue;
    vox.set(inward[0], y, inward[1], "glowstone");
    lit++;
  }
}

// 7. Roof plant: small plant boxes on the core of the tower tiers, and a stair-free roof with a few units.
let plant = 0;
for (const [key] of foot) {
  const x = key % W, z = Math.floor(key / W), T = top.get(key);
  if (!core(key) || T < 43 || x % 10 !== 5 || z % 10 !== 5) continue;
  vox.set(x, T + 1, z, "light_gray_concrete");
  vox.set(x, T + 2, z, "light_gray_concrete");
  plant++;
}

const res = vox.save(OUT);
console.log(JSON.stringify({ cells: foot.size, shell: stats.shell, core: stats.core, interior: stats.interior, tiers: Object.fromEntries([...stats.tiers].sort((a, b) => a[0] - b[0])), door: [ex, efs, ez], lit, plant, ...res }));
