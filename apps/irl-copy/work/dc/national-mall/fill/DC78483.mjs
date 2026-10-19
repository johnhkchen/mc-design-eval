// 601 4th St NW (Commercial-Office-Large): a 1960s-70s federal office block on the Judiciary Square side of the Mall grid.
// Precast light-gray concrete piers and storey spandrels, a dark tinted-glass window grid recessed behind them, a granite
// base course and a recessed granite-canopied entrance on the south face. The lidar roof is smoothed to four clean tiers:
// wings 14 (7 storeys of 2 blocks, about 4.8 m each), 16, the main block 18 (9 storeys), and the central spine 19.
// Every tier stands on the solid row below it; the downhill west side is carried down on a stone-brick foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78483.cells.json`, "utf8"));

const tier = (roof) => (roof <= 14 ? 14 : roof <= 16 ? 16 : roof <= 18 ? 18 : 19);
const top = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, tier(roof)]));
const H = (x, z) => top.get(`${x},${z}`) ?? 0;          // outside the footprint: nothing, top 0

const FACES = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
];
// Faces of a cell at row y that show outside: the neighbour is outside the footprint or lower, and y is above its roof.
const exposed = (x, z, y, h) => FACES.filter((f) => { const n = H(x + f.dx, z + f.dz); return n < h && n <= y && y <= h - 2; });
const stepFaces = (x, z, h) => FACES.filter((f) => H(x + f.dx, z + f.dz) < h);
// A lower neighbour's roof is the floor under the step: that row is solid across the cell, so the wall above stands on it.
const onStep = (x, z, y, h) => FACES.some((f) => { const n = H(x + f.dx, z + f.dz); return n > 0 && n < h && n - 1 === y; });

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);
const windows = [];

// 1. Foundation, then the shell: every storey a solid floor, the outside rows glazed behind concrete piers, roof capped.
for (const [x, z, g, roof] of cells) {
  const h = tier(roof);
  for (let y = 0; y < h; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                          // foundation under the downhill ground
    if (y === h - 1) {
      put(x, y, z, stepFaces(x, z, h).length ? "light_gray_concrete" : "smooth_stone"); // parapet on the edge, roof inside
      continue;
    }
    const faces = exposed(x, z, y, h);
    if (faces.length) {
      if (y < 2) put(x, y, z, "polished_granite");                                  // granite base course
      else if (y % 2 === 0) put(x, y, z, "smooth_stone");                           // spandrel / storey line
      else if (faces.length > 1) put(x, y, z, "light_gray_concrete");              // corner pier
      else if ((faces[0].dz !== 0 ? x : z) % 3 === 0) put(x, y, z, "light_gray_concrete"); // pier every 3
      else { put(x, y, z, "gray_stained_glass_pane"); windows.push([x, y, z, faces[0]]); }
    } else if (y % 2 === 0 || y === h - 2 || onStep(x, z, y, h)) {
      put(x, y, z, "stone");                                                        // floor slab / ceiling / step floor
    }
  }
}

// 2. Warm light: a glowstone in the air gap just inside about one window in ten, so it shows through the glass.
windows.forEach(([x, y, z, f], i) => {
  if (i % 10 !== 2) return;
  const ix = x - f.dx, iz = z - f.dz;
  // the plan, not the list, decides: a canopy or lintel may have taken the window since it was recorded
  if (H(ix, iz) > y && !at(ix, y, iz) && at(x, y, z)?.block === "gray_stained_glass_pane") put(ix, y, iz, "glowstone");
});

// 3. Entrance: a dark oak door on the south face of the 16 tier, nearest the middle, a granite canopy over it.
const [dx, dz] = cells.filter(([x, z]) => H(x, z) === 16 && H(x, z + 1) === 0)
  .sort((a, b) => Math.abs(a[0] - 9) - Math.abs(b[0] - 9))[0];
put(dx, 0, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const ox of [-1, 0, 1]) {
  put(dx + ox, 2, dz, "polished_granite");                                         // lintel course over the lobby
  put(dx + ox, 3, dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // canopy on the spandrel
}

// 4. Roof plant: a 3 x 3 mechanical penthouse on the main block's roof, and a low 2 x 2 plant block beside it.
const plant = (x0, z0, w, d, y0, y1, block) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) for (let y = y0; y <= y1; y++)
    if (H(x, z) === 18 && !stepFaces(x, z, 18).length) put(x, y, z, block);
};
plant(6, 9, 3, 3, 18, 19, "light_gray_concrete");
plant(12, 22, 2, 2, 18, 18, "gray_concrete");

// Save: the module is 19 wide, 31 high, 33 deep (x, y, z); the lowest ground under the footprint is y 0.
const g = new Voxels([19, 31, 33]);
for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC78483.nbt`);
console.log(`DC78483.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
