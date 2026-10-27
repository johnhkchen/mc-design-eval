import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 23907314: a one-storey interwar shop row along a diagonal street edge. The record's roof is about 4 blocks above
// the lowest ground, so the wall line sits at y 4 and the lidar's taller cells (roof 3) step up to parapet bays at y 5.
// Base course, shopfront glazing with timber pillars and a few lit windows, a red frieze as the storey line, and a
// stone cornice. Entrances every 16 cells. One cell deep, so the glass has air behind it and there is no interior.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907314.cells.json", "utf8"));   // [x, z, ground, roof]
const g = new Voxels([93, 16, 32]);

// walk the strip from its south-west end so the pillars, lit windows and doors fall in a rhythm along the frontage
const along = [...cells].sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[0] - b[0]);

along.forEach(([x, z, ground, roof], i) => {
  const bay = roof >= 3, cap = bay ? 5 : 4;
  // foundation up to the ground surface, then a stone base course on it
  for (let y = 0; y < ground; y++) g.set(x, y, z, "cobblestone");
  g.set(x, ground, z, "stone_bricks");
  // shopfront glazing between the base course and the frieze, with timber pillars every third cell
  for (let y = ground + 1; y <= 2; y++) {
    if (i % 3 === 0) g.set(x, y, z, "dark_oak_planks");
    else if (y === 2 && i % 7 === 4) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "glass_pane");
  }
  // entrance: a two-block door in the base course and the glazing, under the frieze
  if (!bay && i % 16 === 8) {
    for (const half of ["lower", "upper"]) {
      g.set(x, half === "lower" ? ground : ground + 1, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
    }
  }
  g.set(x, 3, z, "smooth_quartz");                                    // frieze: the storey line, cream plaster
  if (bay) g.set(x, 4, z, "red_terracotta");                          // parapet bay one block above the roof line
  g.set(x, cap, z, "stone_brick_slab", { type: "bottom" });           // cornice
});

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23907314.nbt");
console.log(JSON.stringify(out));
