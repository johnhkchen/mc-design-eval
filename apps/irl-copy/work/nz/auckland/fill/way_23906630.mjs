// Princes Court (way 23906630): a 1970s Auckland office block on the lidar massing. Six storeys (4 blocks each) on a
// 25-block roof, a seven-storey core where the lidar rises to 29, lower wings where it drops. Basalt-stone plinth,
// concrete piers and spandrels, tinted glass, a dark-glass door on the west face, lit windows at dusk.
// Every cell stands on a solid foundation down to its ground; storeys are a hollow shell (1 block skin, air inside,
// a floor slab per storey), so nothing floats and the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906630.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23906630.nbt";

const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { x, z, g, r, rq: 0 });
const at = (x, z) => foot.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Roof tiers: a 3x3 median of the lidar roof kills the noise, then the nearest storey line 4m+1 (slab at 4m, open air
// from 4m+1 up). Never lower than one storey above the cell's own ground.
for (const c of foot.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  const med = v[Math.floor(v.length / 2)];
  const m = Math.max(Math.round((med - 1) / 4), 1, Math.ceil((c.g + 1) / 4));
  c.rq = 4 * m + 1;
}

// The sides of a cell open to air at height y: outside the footprint, or a neighbour whose roof is already below y.
function open(c, y) {
  const out = [];
  for (const [dx, dz] of NB) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || y >= n.rq) out.push([dx, dz]);
  }
  return out;
}

const vox = new Voxels([46, 42, 45]);
const lights = [];
const cz = [...foot.values()].reduce((s, c) => s + c.z, 0) / foot.size;

for (const c of foot.values()) {
  const { x, z, g, rq } = c;
  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");                 // foundation down to the ground
  for (let y = g; y < rq; y++) {
    if (y % 4 === 0) { vox.set(x, y, z, "smooth_stone"); continue; }             // floor slab (and roof slab at 4m)
    const out = open(c, y);
    if (!out.length) continue;                                                  // interior: air behind the skin
    const along = out[0][0] !== 0 ? z : x;                                      // coordinate running along this wall
    let block;
    if (y === g) block = "stone_bricks";                                        // base course
    else if (y % 4 === 3) block = "light_gray_concrete";                        // spandrel under each window band
    else if (out.length > 1 || along % 4 === 0) block = "white_concrete";       // piers every 4th block, corners always
    else {
      block = (along + y) % 9 === 4 ? "cyan_stained_glass" : "light_blue_stained_glass";
      if (y % 4 === 1 && along % 6 === 2) lights.push([x - out[0][0], y, z - out[0][1]]);
    }
    vox.set(x, y, z, block);
  }
}

// Parapet on every roof edge (open at the roof line), one block above the roof slab.
for (const c of foot.values()) if (open(c, c.rq).length) vox.set(c.x, c.rq, c.z, "white_concrete");

// Lit rooms behind some windows: glowstone on the interior air cell just inside the glass.
for (const [x, y, z] of lights) {
  const n = at(x, z);
  if (n && y >= n.g && y < n.rq && !open(n, y).length && vox.val(x, y, z) === 0) vox.set(x, y, z, "glowstone");
}

// Entrance: a dark-glass door in the west face, nearest the middle of the frontage, with a stone lintel and a lantern inside.
const doors = [...foot.values()].filter((c) => c.rq >= 17 && open(c, c.g + 1).some(([dx, dz]) => dx === -1 && dz === 0));
doors.sort((a, b) => Math.abs(a.z - cz) - Math.abs(b.z - cz));
const d = doors[0];
if (d) {
  vox.set(d.x, d.g, d.z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(d.x, d.g + 1, d.z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(d.x, d.g + 2, d.z, "stone_bricks");
  if (vox.val(d.x + 1, d.g + 1, d.z) === 0) vox.set(d.x + 1, d.g + 1, d.z, "lantern", { hanging: "false" });
}

// Roof plant: 2x2x2 concrete boxes on the open roof of the interior, on a regular grid.
const same = (x, z, rq) => { const n = at(x, z); return n && n.rq === rq && NB.every(([dx, dz]) => { const m = at(x + dx, z + dz); return m && m.rq === rq; }); };
for (const c of foot.values()) {
  if (c.x % 8 !== 4 || c.z % 8 !== 4 || c.rq < 17) continue;
  const box = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (!box.every((n) => n && n.rq === c.rq && !open(n, c.rq - 1).length)) continue;
  for (const n of box) for (let y = c.rq; y < c.rq + 2; y++) vox.set(n.x, y, n.z, "light_gray_concrete");
}

vox.save(OUT);

// Floating check: a block with air below it and air on all four sides (not counting the ground).
let floating = 0;
const [X, Y, Z] = vox.size;
for (let y = 1; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!vox.val(x, y, z) || vox.val(x, y - 1, z)) continue;
  if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => vox.val(x + dx, y, z + dz))) floating++;
}
const tops = [...foot.values()].reduce((m, c) => Math.max(m, c.rq), 0);
console.log(JSON.stringify({ cells: foot.size, topY: tops, doorAt: d ? [d.x, d.g, d.z] : null, lights: lights.length, floating, out: OUT }));
