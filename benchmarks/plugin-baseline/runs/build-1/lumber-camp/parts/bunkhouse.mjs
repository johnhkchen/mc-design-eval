// Part: Bunkhouse log shell (plinth, saddle-notched log courses, floors, partition, porch deck, west cordwood). No roof.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { plinthCourse, logCourse, porchBay, cordwood, SPRUCE_PLANKS } from "../vocab.mjs";

// Opening cells left as air (plan OPENINGS + RESERVED hearth).
const boxCells = (x0, x1, y0, y1, z0, z1) => {
  const o = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) o.push([x, y, z]);
  return o;
};
const OPEN = [
  ...boxCells(13, 13, 2, 3, 8, 8),   // front door
  ...boxCells(6, 7, 3, 4, 8, 8),     // front window bunkroom
  ...boxCells(15, 16, 3, 4, 8, 8),   // front window mess
  ...boxCells(18, 18, 3, 4, 9, 10),  // east window
  ...boxCells(18, 18, 2, 3, 12, 13), // hearth
  ...boxCells(4, 4, 3, 4, 12, 13),   // west window
  ...boxCells(7, 7, 2, 3, 17, 17),   // back door
  ...boxCells(14, 15, 3, 4, 17, 17), // back window
];

export function build(g) {
  plinthCourse(g, 4, 8, 18, 17, 1);
  for (let y = 2; y <= 5; y++) {
    if (y % 2 === 0) {
      // even courses: north/south logs run 1 past each corner
      logCourse(g, 3, 19, y, 8, "x", OPEN);
      logCourse(g, 3, 19, y, 17, "x", OPEN);
      logCourse(g, 9, 16, y, 4, "z", OPEN);
      logCourse(g, 9, 16, y, 18, "z", OPEN);
    } else {
      // odd courses: east/west logs run 1 past each corner
      logCourse(g, 7, 18, y, 4, "z", OPEN);
      logCourse(g, 7, 18, y, 18, "z", OPEN);
      logCourse(g, 5, 17, y, 8, "x", OPEN);
      logCourse(g, 5, 17, y, 17, "x", OPEN);
    }
  }
  // ground floor and loft floor (hatch at 5,5,16 left air; stairwell 15..17,5,16 left air for the mess stair, room-2)
  g.fill([5, 1, 9], [17, 1, 16], SPRUCE_PLANKS);
  for (let x = 5; x <= 17; x++) for (let z = 9; z <= 16; z++) if (!(x === 5 && z === 16) && !(z === 16 && x >= 15)) g.set(x, 5, z, SPRUCE_PLANKS);
  // partition with doorway (10,2..3,13)
  for (let z = 9; z <= 16; z++) for (let y = 2; y <= 4; y++) if (!(z === 13 && y <= 3)) g.set(10, y, z, SPRUCE_PLANKS);
  // porch
  porchBay(g, 5, 9);
  porchBay(g, 9, 17, 5, { skip: [13] });
  g.set(13, 1, 4, ...B.stairs("spruce", "south"));
  // west cordwood
  cordwood(g, 2, 9, 3, 10, 1, 2, "z");
}
