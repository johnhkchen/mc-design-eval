import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s Federal-revival civic block on the Mall: red brick over a stone base, calcite (limestone) string courses,
// quoins and cornice, a 3-bay central pavilion one tier higher with the entrance in the forecourt notch, and an open
// air gap behind every pane (interior cells are air apart from the floor slabs and a few warm lights).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59515.cells.json", "utf8"));
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const exterior = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz));

const g = new Voxels([9, 20, 4]);
const glass = (ew) => ({ north: ew ? "false" : "true", south: ew ? "false" : "true", east: ew ? "true" : "false", west: ew ? "true" : "false", waterlogged: "false" });
const WINDOWS = new Set(["2,0", "6,0", "2,3", "4,3", "6,3", "0,2", "8,2"]); // each with air behind; the end bays face east and west
const CORNERS = new Set(["0,0", "7,0", "8,1", "1,3", "7,3"]);
const LAMPS = [[2, 1, 1], [6, 1, 1]];                                       // glowstone behind the ground-floor panes
const LANTERNS = [[2, 4, 2], [4, 4, 2], [6, 4, 2]];                         // lanterns on the second-floor slab

for (const [x, z, ground, roof] of cells) {
  const k = `${x},${z}`, e = exterior(x, z), pavilion = roof >= 8;
  const corner = CORNERS.has(k), win = WINDOWS.has(k);
  g.set(x, 0, z, "stone_bricks");                                            // base course, the lowest ground under the footprint
  for (const y of [1, 2]) {                                                  // ground floor
    if (!e) { if (LAMPS.some(([lx, ly, lz]) => lx === x && ly === y && lz === z)) g.set(x, y, z, "glowstone"); continue; }
    if (x === 4 && z === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (win) g.set(x, y, z, "glass_pane", glass(z !== 2 || x !== 0 && x !== 8));
    else g.set(x, y, z, corner || (z === 1 && (x === 3 || x === 5)) ? "calcite" : "bricks");
  }
  g.set(x, 3, z, "calcite");                                                 // string course and second-floor slab
  for (const y of [4, 5]) {                                                  // second floor
    if (!e) { if (y === 4 && LANTERNS.some(([lx, , lz]) => lx === x && lz === z)) g.set(x, y, z, "lantern", { hanging: "false" }); continue; }
    if (win || (x === 4 && z === 1)) g.set(x, y, z, "glass_pane", glass(!(x === 0 || x === 8)));
    else g.set(x, y, z, corner || (z === 1 && (x === 3 || x === 5)) ? "calcite" : "bricks");
  }
  g.set(x, 6, z, e ? "calcite" : "smooth_stone");                           // cornice on the outside, a plain roof deck within
  if (pavilion && e) g.set(x, 7, z, "calcite");                              // pavilion parapet ring on the outer cells
  if (pavilion && x === 4 && z === 2) g.set(x, 7, z, "lantern", { hanging: "false" });   // roof equipment: a lantern on the deck
}

const file = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59515.nbt";
console.log(g.save(file));
