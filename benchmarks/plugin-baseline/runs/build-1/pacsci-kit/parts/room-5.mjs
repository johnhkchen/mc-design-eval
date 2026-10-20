// Part "room: E wing exhibit halls": the interior of the E wing exhibit halls (ROOM_BOX.e_exhibit), a deep hall of display
// tables and benches round a forest diorama at the centre, lit by standing lamp posts on a 6-block grid. Writes only into
// air inside the box, skips any cell it has already taken, and keeps the lanes from the three loggia doors and the east
// service door clear (x 64, z 77 and z 158 edges, the x 130 edge, the cross lanes at z 113..114 and x 96..97).
import { ROOM_BOX, SMOOTH_QUARTZ, QUARTZ_PILLAR, SEA_LANTERN } from "../vocab/base.mjs";
import { poplar } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const [X0, , Z0, X1, , Z1] = ROOM_BOX.e_exhibit;
const inside = (x, z) => x >= X0 && x <= X1 && z >= Z0 && z <= Z1;

// The diorama: a rim of diorite walls round x 104..118 z 106..121, open on its west side at z 113..114.
const DIO = { x0: 104, x1: 118, z0: 106, z1: 121 };
const inDiorama = (x, z) => x >= DIO.x0 && x <= DIO.x1 && z >= DIO.z0 && z <= DIO.z1;

export function build(g) {
  const taken = new Set();
  const key = (x, y, z) => `${x},${y},${z}`;
  // Writes one cell if it is inside the room, air-free of earlier claims, and not already taken. Returns true when placed.
  const put = (x, y, z, ...pair) => {
    if (!inside(x, z) || taken.has(key(x, y, z))) return false;
    taken.add(key(x, y, z));
    g.set(x, y, z, ...pair);
    return true;
  };

  // Display table: a quartz pillar on the floor with a smooth quartz block on top (a 2-high plinth, its top at y 3).
  const table = (x, z) => {
    put(x, 1, z, ...B.pillar(QUARTZ_PILLAR, "y"));
    put(x, 2, z, SMOOTH_QUARTZ);
  };
  // Bench on either side of a table: a smooth quartz stair whose full back faces away from the table.
  const benches = (x, z) => {
    put(x, 1, z - 1, ...B.stairs(SMOOTH_QUARTZ, "north", "bottom"));
    put(x, 1, z + 1, ...B.stairs(SMOOTH_QUARTZ, "south", "bottom"));
  };
  // Standing lamp post: a quartz pillar on the floor with a standing lantern on top (light 14 at the post).
  const lamp = (x, z) => {
    if (put(x, 1, z, ...B.pillar(QUARTZ_PILLAR, "y"))) put(x, 2, z, ...B.lantern(false));
  };

  // 1. The diorama (focal piece, the brightest point: a sea lantern pedestal at its centre, seen down the z 113 lane).
  for (let x = DIO.x0; x <= DIO.x1; x++) {
    for (let z = DIO.z0; z <= DIO.z1; z++) {
      const edge = x === DIO.x0 || x === DIO.x1 || z === DIO.z0 || z === DIO.z1;
      const gap = x === DIO.x0 && (z === 113 || z === 114);
      if (edge && !gap) put(x, 1, z, ...B.wall("diorite"));
    }
  }
  for (const [x, z] of [[108, 109], [114, 109], [108, 118], [114, 118]]) {
    poplar(g, x, z, 5, { y: 1 });
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) taken.add(key(x + dx, 2, z + dz));
  }
  put(111, 1, 113, ...B.pillar(QUARTZ_PILLAR, "y"));
  put(111, 2, 113, SEA_LANTERN);

  // 2. Display tables with benches, grouped by quadrant (each table has a bench north and south of it).
  const TABLES = [
    // north-west quarter
    [72, 84], [82, 84], [92, 84], [72, 96], [82, 96], [92, 96], [72, 106], [82, 106], [92, 106],
    // south-west quarter
    [72, 122], [82, 122], [92, 122], [72, 134], [82, 134], [92, 134], [72, 146], [82, 146], [92, 146],
    // north-east quarter
    [104, 84], [114, 84], [124, 84], [104, 96], [114, 96], [124, 96],
    // south-east quarter
    [102, 128], [112, 128], [122, 128], [104, 138], [114, 138], [124, 138], [104, 148], [114, 148], [124, 148],
  ];
  for (const [x, z] of TABLES) {
    table(x, z);
    benches(x, z);
  }

  // 3. Lamp posts on a 6-block grid, every one where the floor is free (the lanes and the diorama stay clear).
  for (const x of [68, 74, 80, 86, 92, 98, 104, 110, 116, 122, 128]) {
    for (const z of [80, 86, 92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152]) {
      if (x >= 127 && z <= 91) continue; // the E wing stair's foot and head, x 128..130 z 77..90
      if (inDiorama(x, z)) continue;
      lamp(x, z);
    }
  }
}
