import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 9 x 3 Federal-style office block in pale limestone (smooth quartz) on a granite base: three storeys
// over a low west bay, a one-cell rear tower reaching the full 11 blocks, and an east cheek at 7.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80620.cells.json", "utf8"));   // [x, z, ground, roof]

// The lidar roof heights, snapped to four flat tiers: west bay 4, middle wing 5, rear tower 11, east cheek 7.
const tier = (x, z) => (x <= 1 ? 4 : z === 0 ? 11 : x >= 7 ? 7 : 5);
const foot = new Map(cells.map(([x, z]) => [`${x},${z}`, tier(x, z)]));
const has = (x, z) => foot.has(`${x},${z}`);

const g = new Voxels([9, 23, 3]);

// Storey lines every 3 blocks from y1 (y1, 4, 7, 10 are floor slabs / sills / heads); windows are the two rows between.
// The front and back rows (z 0 and 2) carry the glass, pilasters every other column; the middle row is an air gap
// behind the glass, closed top and bottom by the floor slabs.
const PILLAR = ["quartz_pillar", { axis: "y" }];
const PANE_FACE = ["glass_pane", { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }];
const PANE_END = ["glass_pane", { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" }];

function cell(x, y, z, top) {
  if (y === 0) return ["polished_granite"];                 // base course
  if (y === top) return ["chiseled_quartz_block"];           // cornice / parapet cap
  if ((y - 1) % 3 === 0) return ["smooth_quartz"];           // storey line, floor slab, sill and head
  const endW = !has(x - 1, z), endE = !has(x + 1, z);
  if (z === 1) {
    if (endW) return PILLAR;                                 // west end wall
    if (endE) return PANE_END;                               // east end: glazed onto the air gap
    return null;                                             // air gap behind the glass
  }
  if (endW || endE || x % 2 === 0) return PILLAR;            // pilasters and end walls
  return PANE_FACE;
}

for (const [x, z, ground] of cells) {
  const top = foot.get(`${x},${z}`) - 1;
  for (let y = ground; y <= top; y++) {
    const spec = cell(x, y, z, top);
    if (spec) g.set(x, y, z, spec[0], spec[1]);
  }
}

// Entrance on the front: a dark oak door under a solid lintel, a lantern hung either side of it.
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(4, 1, 2, "dark_oak_door", { ...door, half: "lower" });
g.set(4, 2, 2, "dark_oak_door", { ...door, half: "upper" });
g.set(3, 3, 2, "smooth_quartz");
g.set(5, 3, 2, "smooth_quartz");
g.set(3, 2, 2, "lantern", { hanging: "true", waterlogged: "false" });
g.set(5, 2, 2, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light behind the glass in some bays, in the air gap.
g.set(1, 2, 1, "glowstone");
g.set(3, 3, 1, "shroomlight");
g.set(5, 2, 1, "glowstone");

// Roof equipment on the middle wing: two lanterns on the cap.
g.set(3, 5, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(5, 5, 1, "lantern", { hanging: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80620.nbt");
