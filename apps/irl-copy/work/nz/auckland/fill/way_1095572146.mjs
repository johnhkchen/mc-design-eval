// Way 1095572146: a 6 x 8 Edwardian-style brick commercial block, two storeys over a shopfront, flat roof with a
// cream plaster cornice and parapet, a small brick plant room on the roof. The footprint comes from the cells file;
// the massing follows the lidar roof height (all cells 9), and the shell is one block thick with air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572146.cells.json", "utf8"));   // [x, z, ground, roof]
const g = new Voxels([6, 22, 8]);

// per footprint cell: its roof height (a cell with roof 0 is not part of the building)
const H = new Map();
for (const [x, z, , roof] of cells) if (roof > 0) H.set(`${x},${z}`, roof);
const built = (x, z) => H.has(`${x},${z}`);
const roofOf = (x, z) => H.get(`${x},${z}`);

// horizontal neighbours: the outward direction names and the inward (opposite) step
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const exteriorFaces = (x, z) => Object.keys(DIRS).filter((d) => !built(x + DIRS[d][0], z + DIRS[d][1]));

// the materials
const PLINTH = "polished_andesite", FLOOR = "smooth_stone", BRICK = "bricks", STONE = "stone_bricks", QUARTZ = "smooth_quartz";
const GLASS = "glass_pane", TIMBER = "dark_oak_planks", LIGHT = "lantern";

// the rows of the massing, with H = the roof height from lidar: plinth y0, ground storey y1..3, string course y4,
// upper storey y5..7, cornice at H-1, parapet at H
for (const [key, roof] of H) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorFaces(x, z);
  const perimeter = ext.length > 0;
  // plinth and floors: solid under every storey, so nothing hangs
  g.set(x, 0, z, perimeter ? PLINTH : FLOOR);
  g.set(x, 4, z, perimeter ? QUARTZ : FLOOR);
  g.set(x, roof - 1, z, perimeter ? QUARTZ : FLOOR);           // cornice on the wall ring, roof deck inside
  if (!perimeter) continue;
  // the parapet: a cream cap on the wall ring
  g.set(x, roof, z, QUARTZ);

  // wall storeys: window cells alternate on a checkerboard; the street side (north faces) is the shopfront
  const windowCell = (x + z) % 2 === 0;
  const street = ext.includes("n");
  const state = (x, z) => ({ north: built(x, z - 1) ? "true" : "false", south: built(x, z + 1) ? "true" : "false", east: built(x + 1, z) ? "true" : "false", west: built(x - 1, z) ? "true" : "false", waterlogged: "false" });

  // ground storey
  if (street) {
    for (const y of [1, 2]) g.set(x, y, z, GLASS, state(x, z));
    g.set(x, 3, z, TIMBER);                       // timber fascia over the shopfront
  } else if (windowCell) {
    for (const y of [1, 2]) g.set(x, y, z, GLASS, state(x, z));
    g.set(x, 3, z, STONE);                        // stone lintel
  } else {
    for (const y of [1, 2, 3]) g.set(x, y, z, BRICK);
  }

  // upper storey
  if (windowCell) {
    for (const y of [5, 6]) g.set(x, y, z, GLASS, state(x, z));
    g.set(x, 7, z, STONE);
  } else {
    for (const y of [5, 6, 7]) g.set(x, y, z, BRICK);
  }
}

// the entrance: a dark oak door on the north shopfront, the first north-facing cell that is not a corner of the plan
const doorCell = cells.filter(([x, z, , r]) => r > 0 && exteriorFaces(x, z).includes("n") && !exteriorFaces(x, z).some((d) => d !== "n" && d !== "s"))[0];
if (doorCell) {
  const [dx, dz] = doorCell;
  g.set(dx, 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm lamps standing on the floor just inside some windows (the air gap behind the glass)
for (const [key, roof] of H) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorFaces(x, z);
  if (!ext.length || (x + z) % 4 !== 0) continue;
  // an interior neighbour of this window cell (not a wall ring cell), if one exists
  const inward = Object.keys(DIRS).map((d) => [x + DIRS[d][0], z + DIRS[d][1]]).find(([ix, iz]) => built(ix, iz) && exteriorFaces(ix, iz).length === 0);
  if (!inward) continue;
  for (const y of [1, 5]) g.set(inward[0], y, inward[1], LIGHT, { hanging: "false", waterlogged: "false" });
}

// roof equipment: a small plant room of brick on two interior roof cells
for (const [x, z] of [[3, 3], [3, 4]]) {
  if (!built(x, z)) continue;
  const roof = roofOf(x, z);
  g.set(x, roof, z, STONE);
  g.set(x, roof + 1, z, STONE);
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572146.nbt");
console.log(JSON.stringify(info));
