// DC54043: a 1930s stripped-classical office block on a diagonal corner of the Mall (Federal Triangle idiom):
// pale limestone walls, a stone plinth, four storeys (ground shopfront + three office floors) with storey bands,
// glazed bays on piers, a cornice and a parapet, a limestone entrance bay, and a few glowstone-lit windows.
// Two wings split by a one-row gap (z 6): the gap is left open, as a passage. Built only on footprint cells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54043.cells.json", "utf8"));   // [x, z, ground, roof]

const W = 8, D = 17;
const byKey = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof: Math.round(roof) }]));
const inFoot = (x, z) => byKey.has(`${x},${z}`);

// the roof sits at the lidar height (11 above y 0): the top course is the parapet, at y = roof - 1
const ROOF = Math.max(...cells.map((c) => Math.round(c[3])));
const TOP = ROOF - 1;                       // parapet course (y 10)
const CORNICE = TOP - 1;                    // cornice / roof slab (y 9)
const storeyBands = [3, 6, 9];              // string courses (solid across the footprint, they are the floor slabs)

const Y = ROOF + 12;                        // room above the lidar roof for the rooftop vents
const g = new Voxels([W, Y, D]);

// the block choices
const STONE = "calcite", PLINTH = "stone_bricks", BAND = "smooth_quartz", ROOFSLAB = "smooth_stone";
const GLASS = "light_blue_stained_glass", LIT = "glowstone", DOOR = "iron_door";
const PIER = "calcite", CAP = "smooth_quartz";

// a boundary cell: any 4-neighbour is outside the footprint; its corner-ness counts outside neighbours
const outside = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFoot(x + dx, z + dz)).length;
const isBoundary = (x, z) => outside(x, z) > 0;

// piers on every fourth row of the wings, and on true corners (outside on both an x and a z side); the other bays are glazed
const isPier = (x, z) => {
  const xFace = !inFoot(x - 1, z) || !inFoot(x + 1, z);    // a face towards the east or west
  const zFace = !inFoot(x, z - 1) || !inFoot(x, z + 1);    // a face towards the north or south
  return (xFace && zFace) || z % 4 === 0;
};

// the entrance: the south end of the south wing, two cells (x 1..2) on the south face; the door is x 1
const DOOR_CELL = [1, 16];

// lit bays: some upper-floor and ground bays, on a fixed pattern so the render is repeatable
const isLit = (x, z, y) => (z * 3 + y * 5 + x) % 7 === 0 && !isPier(x, z);

// the ground under each cell: fill solid from y 0 to the ground (zero here), then the plinth course at y 0
for (const [x, z, ground] of cells) {
  for (let y = 0; y < Math.round(ground); y++) g.set(x, y, z, PLINTH);
}

for (const [x, z] of cells) {
  const b = isBoundary(x, z);
  // y 0: the plinth course, full footprint
  g.set(x, 0, z, PLINTH);

  // ground storey (y 1..2): shopfront glazing between piers, the entrance door
  for (let y = 1; y <= 2; y++) {
    if (!b) continue;
    if (x === DOOR_CELL[0] && z === DOOR_CELL[1]) {
      if (y === 1) g.set(x, y, z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isPier(x, z)) g.set(x, y, z, PIER);
    else if (isLit(x, z, y)) g.set(x, y, z, LIT);
    else g.set(x, y, z, GLASS);
  }

  // the storey bands: the floor slab over the whole footprint, a string course on the face
  for (const y of storeyBands) g.set(x, y, z, BAND);

  // upper office floors (y 4..5 and y 7..8): glazed bays on piers, air behind the glass
  for (const [lo, hi] of [[4, 5], [7, 8]]) {
    for (let y = lo; y <= hi; y++) {
      if (!b) continue;
      if (isPier(x, z)) g.set(x, y, z, PIER);
      else if (isLit(x, z, y)) g.set(x, y, z, LIT);
      else g.set(x, y, z, GLASS);
    }
  }

  // the roof slab / cornice: a projecting course on the face, the roof deck inside
  g.set(x, CORNICE, z, b ? BAND : ROOFSLAB);

  // the parapet: a solid course on the edge, pier caps every third bay
  if (b) g.set(x, TOP, z, isPier(x, z) ? CAP : STONE);
}

// rooftop vents: two iron boxes on the open roof deck, set back from the parapet, above the lidar roof
const inner = cells.filter(([x, z]) => !isBoundary(x, z));
const vents = inner.filter((_, i) => i % 3 === 0).slice(0, 2);
for (const [x, z] of vents) g.set(x, TOP, z, "iron_block");

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54043.nbt");
console.log(JSON.stringify({ cells: cells.length, interior: inner.length, vents: vents.length, ...info }));
