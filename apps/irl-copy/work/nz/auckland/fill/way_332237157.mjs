// Tātai Hono Marae (way 332237157), built from the lidar record. Massing: a three-tier meeting house (the core, roof at
// 13 blocks) stepping down through a two-storey wing (10) and a single-storey lean-to (6) to a porch (3). Each cell's
// column is solid from its ground up, so every tier stands on the one below. Walls are a shell with an air gap behind
// the glass; floor slabs at each storey line. The core is dark timber, the wings plaster, the base stone, the roof
// deepslate tile with stair eaves at the outer edge.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237157.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..27, z 0..34

// Roof tiers from the lidar roof height (smoothed into three flat tiers plus a porch): 13 core, 10 wings, 6 lean-to, 3 porch.
const tierOf = (R) => (R >= 12 ? 13 : R >= 8 ? 10 : R >= 4 ? 6 : 3);
const cell = new Map();
for (const [x, z, g, R] of cells) cell.set(`${x},${z}`, { g, T: tierOf(R) });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// the neighbours of a cell: { facing, top } where top is the neighbour's tier (-1 for outside the footprint)
const around = (x, z) => Object.entries(DIRS).map(([facing, [dx, dz]]) => { const n = at(x + dx, z + dz); return { facing, top: n ? n.T : -1 }; });

const g = new Voxels([28, 26, 35]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const wallBlock = (x, z, y, gr, T) => {
  if (y < 4 && y < gr + 1) return "stone_bricks";                                      // base course
  if (y === 4 || y === 8) return T === 13 ? "stripped_spruce_log" : "oak_planks";      // storey band
  if (y % 4 === 1 || y % 4 === 2) {                                                   // window rows: a window every third cell
    if ((x + z) % 3 === 1) return (x * 5 + z * 3) % 7 === 0 ? "glowstone" : "glass_pane"; // some lit behind the glass
  }
  return T === 13 ? "dark_oak_planks" : "white_concrete";
};

for (const [key, { g: gr, T }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const nb = around(x, z);
  const outer = nb.filter((n) => n.top < 0);
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  // the body, from ground to the tier top
  for (let y = gr; y < T - 1; y++) {
    const exterior = nb.some((n) => n.top < 0 || n.top <= y);
    if (exterior) set(x, y, z, wallBlock(x, z, y, gr, T));
    else if (y === gr || y === 4 || y === 8) set(x, y, z, "oak_planks");              // interior floor slab per storey
  }
  // the roof cap at the tier top; outer edges get stair eaves that fall away from the footprint
  const y = T - 1;
  if (outer.length) set(x, y, z, "deepslate_tile_stairs", { facing: outer[0].facing, half: "bottom", shape: "straight", waterlogged: "false" });
  else set(x, y, z, "deepslate_tiles");
}

// Main entrance on the north face of the core: door in the wall at x 11, z 0, with a dark timber lintel above.
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
set(11, 1, 0, "dark_oak_door", door("lower"));
set(11, 2, 0, "dark_oak_door", door("upper"));
set(11, 3, 0, "dark_oak_planks");

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237157.nbt");
console.log(JSON.stringify(res));
