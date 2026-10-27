// The ED (OSM way 256790422), Mt Eden / Auckland: a flat-topped mid-century concrete block, four storeys over a
// stone base, roof at 18 blocks (lidar), a parapet on the top. The lidar roof is 18 over almost the whole footprint,
// so it is one tier with no setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_256790422.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_256790422.nbt";

const W = 54, D = 127, Y = 31;
const ROOF = 18;                                  // storeys at 4 blocks: slabs at y 4, 8, 12, roof deck at 16, parapet to 17
const FP = new Set(cells.map(([x, z]) => x * 1000 + z));
const inFP = (x, z) => FP.has(x * 1000 + z);

// One roof tier: the lidar is 18 over the body of the footprint; its low fringe cells (12-17, the tips) would leave
// storey slabs floating at a lower deck, so they are flattened to the roof rather than stepped.
const top = () => ROOF;

// Ring = the outer wall (1 block deep); anything inside it is air gap behind the glass, plus floor slabs.
const ring = (x, z) => inFP(x, z) && !(inFP(x + 1, z) && inFP(x - 1, z) && inFP(x, z + 1) && inFP(x, z - 1));

// Glass panes connect along the face they sit in (a face at constant x runs along z, and vice versa).
const paneState = (x, z) => {
  const xFace = !inFP(x + 1, z) || !inFP(x - 1, z);
  return { north: String(!xFace), south: String(!xFace), east: String(xFace), west: String(xFace), waterlogged: "false" };
};

const g = new Voxels([W, Y, D]);
const SLABS = [0, 4, 8, 12, 16];                   // storey lines: base slab, floors, roof deck
const WINDOW_BANDS = [[1, 3], [5, 7], [9, 11], [13, 15]];
const ED_Z = [56, 61];                             // the entrance: the west face, six cells wide
const DOOR_Z = 58;
const inEntrance = (x, z) => !inFP(x - 1, z) && z >= ED_Z[0] && z <= ED_Z[1];

// 1. Foundation: solid from y 0 up to each cell's ground, then the interior floor slabs and the outer wall
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, ring(x, z) ? "stone_bricks" : "gray_concrete");
  for (const y of SLABS) if (!ring(x, z)) g.set(x, y, z, "gray_concrete");
}

// 2. The outer wall: base course, storey lines, window bands with white piers, cornice, parapet
for (const [x, z] of cells.map(([x, z]) => [x, z]).filter(([x, z]) => ring(x, z))) {
  const H = top(x, z);
  const faceX = !inFP(x - 1, z) || !inFP(x + 1, z);
  const pier = ((x + z) % 3 === 0) || (!faceX && x % 3 === 0);   // piers every third block along the face
  for (let y = 0; y < H; y++) {
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                       // base course at street level
    if (y === 16) { g.set(x, y, z, "light_gray_concrete"); continue; }               // cornice
    if (y === 17) { g.set(x, y, z, (x + z) % 3 === 0 ? "light_gray_concrete" : "white_concrete"); continue; } // parapet
    if (SLABS.includes(y)) { g.set(x, y, z, "light_gray_concrete"); continue; }     // storey lines
    const band = WINDOW_BANDS.find(([lo, hi]) => y >= lo && y <= hi);
    if (!band) continue;
    if (inEntrance(x, z)) {
      if (y <= 2 && z === DOOR_Z) { g.set(x, y, z, "iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); }
      else g.set(x, y, z, "glass_pane", paneState(x, z));
      continue;
    }
    if (pier) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane", paneState(x, z));
  }
}

// 3. The ED sign band over the entrance, the lit lamps inside behind some windows (glowstone stands on the floor slab,
//    lanterns hang from the slab above), and the plant on the roof deck
for (const [x, z] of cells.map(([x, z]) => [x, z]).filter(([x, z]) => ring(x, z))) {
  if (inEntrance(x, z)) g.set(x, 4, z, "red_concrete");
}
// the inward cell (depth 2) behind a window: the one neighbour that is interior
const inward = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].find(([a, b]) => inFP(a, b) && !ring(a, b));
for (const [x, z] of cells.map(([x, z]) => [x, z]).filter(([x, z]) => ring(x, z))) {
  const inn = inward(x, z); if (!inn) continue;
  // ground floor: hanging lanterns behind the entrance glass
  if (inEntrance(x, z) && z !== DOOR_Z && (z + 1) % 2 === 0) { g.set(inn[0], 3, inn[1], "lantern", { hanging: "true", waterlogged: "false" }); continue; }
  for (const [lo] of WINDOW_BANDS.slice(1)) {
    if (((x * 5 + z * 7 + lo) % 13) === 0) { g.set(inn[0], lo, inn[1], "glowstone"); }  // on the floor slab at the band's base
  }
}
for (const [x, z] of cells.map(([x, z]) => [x, z]).filter(([x, z]) => inFP(x, z) && !ring(x, z))) {
  if (x % 8 >= 3 && x % 8 <= 4 && z % 9 >= 4 && z % 9 <= 5 && top(x, z) >= 18) g.set(x, 17, z, "iron_block");   // roof plant
}

const stats = g.save(OUT);
console.log("saved", OUT, stats, "cells", cells.length);
