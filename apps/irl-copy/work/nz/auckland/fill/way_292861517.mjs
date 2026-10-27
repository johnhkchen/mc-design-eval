// Massey University House, Auckland (way 292861517): a 1970s-2000s concrete-frame office block on a basalt base, eleven storeys
// on a tower-and-podium massing. Lidar roofs are snapped to three flat tiers: a tower core at 46 (parapet to 48, a plant room
// on top, 49 blocks to the top of it), a podium at 42, and wings at 38. Every storey is a light-grey floor line, two rows of blue
// glass with white concrete piers on a 3-block module, and a light-grey spandrel; the ground floor is glass with a dark-oak
// double door on the north face and a dark-oak visor over it. Interiors are air with a floor slab per storey; some windows show
// glowstone just behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861517.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861517.nbt";

const BASE = "polished_blackstone_bricks", SLAB = "smooth_stone", SPANDREL = "light_gray_concrete", PIER = "white_concrete";
const GLASS = "light_blue_stained_glass", ROOF = "gray_concrete", PLANT = "light_gray_concrete";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 29, H = 61, D = 30;

// footprint cell -> its roof tier (a multiple of 4 plus 2, so storey lines sit on one grid from y 2)
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, top: roof >= 45 ? 46 : roof >= 40 ? 42 : 38 });
const at = (x, z) => foot.get(`${x},${z}`);
// a face is open to air at row y when the cell beside it is outside the footprint or its roof is below y
const open = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < y; });
const pier = (x, z) => x % 3 === 0 || z % 3 === 0;

const g = new Voxels([W, H, D]);
const coreCells = [];
for (const [key, { top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (top === 46) coreCells.push([x, z]);
  // foundation and plinth: solid up to the ground floor's slab at y 2 (the lowest ground is y 0)
  for (let y = 0; y < 2; y++) g.set(x, y, z, BASE);
  for (let y = 2; y <= top; y++) {
    const r = (y - 2) % 4;                       // 0 floor line, 1-2 glass band, 3 spandrel
    if (y === top) { g.set(x, y, z, open(x, y, z) ? PLANT : ROOF); continue; }   // roof deck, coping on the edge
    if (r === 0) { g.set(x, y, z, !open(x, y, z) ? SLAB : y === 2 ? BASE : SPANDREL); continue; }   // floor slab per storey
    if (!open(x, y, z)) continue;                // interior: air behind the glass
    if (r === 3) { g.set(x, y, z, SPANDREL); continue; }
    g.set(x, y, z, pier(x, z) ? PIER : GLASS);
    // warm light: glowstone on the inside of some panes, one block back from the glass
    if (r === 2 && (x * 7 + z * 13 + y) % 5 === 0) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = at(x + dx, z + dz);
        if (n && n.top >= y && !open(x + dx, y, z + dz)) { g.set(x + dx, y, z + dz, "glowstone"); break; }
      }
    }
  }
  if (open(x, top, z)) g.set(x, top + 1, z, SPANDREL);   // parapet on the roof edge
}

// the ground-floor entrance on the north face: glass lobby, a dark-oak double door, a dark-oak visor above
for (let x = 8; x <= 13; x++) for (let y = 3; y <= 4; y++) g.set(x, y, 0, GLASS);
for (const x of [10, 11]) {
  const hinge = x === 10 ? "left" : "right";
  g.set(x, 3, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 4, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 8; x <= 13; x++) g.set(x, 6, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });

// a plant room on the tower core: a 3 x 3 box, two blocks tall, set in from the parapet (roof to 49)
const cx = coreCells.reduce((s, [x]) => s + x, 0) / coreCells.length, cz = coreCells.reduce((s, [, z]) => s + z, 0) / coreCells.length;
let best = null;
for (const [x, z] of coreCells) {
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) { const n = at(x + dx, z + dz); if (!n || n.top !== 46) ok = false; }
  const d = Math.hypot(x - cx, z - cz);
  if (ok && (!best || d < best.d)) best = { x, z, d };
}
if (best) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 47; y <= 48; y++) g.set(best.x + dx, y, best.z + dz, PLANT);

const out = g.save(OUT);
console.log(`way_292861517: ${out.blocks} blocks, ${out.palette} palette entries, core ${coreCells.length} cells, plant room ${best ? `at ${best.x},${best.z}` : "none"}`);
