// Stairs and partitions (plan.md P2): the front stair and its newels, the three interior birch stair runs, the
// birch partitions with their doorway gaps (ROOMS), the bedroom-landing door, the brick fireplace surrounds around
// the RESERVED fireboxes, and the well railings. Only ADDS into air; the firebox cells stay air for the room designers.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BIRCH_PLANKS, BRICKS, frontStair, newel, stairRun } from "../vocab.mjs";

const inBox = (b, x, y, z) => x >= b[0] && x <= b[1] && y >= b[2] && y <= b[3] && z >= b[4] && z <= b[5];

// Partition boxes [x0, x1, y0, y1, z0, z1] in birch_planks, with the doorway gaps from ROOMS carved out of them.
const PARTITIONS = [
  // garage level (y1..3)
  { box: [10, 10, 1, 3, 8, 19], gaps: [[10, 10, 1, 2, 12, 12]] },                          // garage-cellar
  { box: [2, 13, 1, 3, 20, 20], gaps: [[6, 7, 1, 2, 20, 20]] },                            // garage-laundry
  // main floor (y5..7)
  { box: [9, 9, 5, 7, 10, 23], gaps: [[9, 9, 5, 7, 14, 15], [9, 9, 5, 7, 19, 20]] },       // parlour-hall, dining-hall
  { box: [2, 8, 5, 7, 16, 16], gaps: [[4, 5, 5, 7, 16, 16]] },                             // parlour-dining
  { box: [2, 13, 5, 7, 24, 24], gaps: [[4, 5, 5, 7, 24, 24], [10, 11, 5, 7, 24, 24]] },   // dining-kitchen, hall-kitchen
  // 2nd floor (y9..11)
  { box: [11, 11, 9, 11, 8, 14], gaps: [] },                                               // front bedroom / landing
  { box: [12, 13, 9, 11, 11, 11], gaps: [] },                                              // seals the well's north
  { box: [2, 10, 9, 11, 16, 16], gaps: [] },                                               // front bedroom / study
  { box: [10, 10, 9, 11, 17, 23], gaps: [[10, 10, 9, 10, 20, 20]] },                       // study-landing
  { box: [2, 13, 9, 11, 24, 24], gaps: [[4, 4, 9, 10, 24, 24], [12, 12, 9, 10, 24, 24]] }, // study-back bedroom, landing-bathroom
  { box: [9, 9, 9, 11, 25, 31], gaps: [] },                                                // back bedroom / bathroom
];

export function build(g) {
  // front stair up to the porch, its newels (over the cheek walls at z2)
  frontStair(g);
  newel(g, 9, 2);
  newel(g, 14, 2);

  // interior stair runs (plan.md ROOMS "Stairs"): garage->main, main->2nd, 2nd->top
  stairRun(g, 12, 13, 23, 1, "north", 3);
  stairRun(g, 12, 13, 12, 5, "south", 3);
  stairRun(g, 12, 13, 17, 9, "south", 3);

  // partitions with their doorway gaps
  for (const { box, gaps } of PARTITIONS)
    for (let x = box[0]; x <= box[1]; x++)
      for (let y = box[2]; y <= box[3]; y++)
        for (let z = box[4]; z <= box[5]; z++) {
          if (gaps.some((gap) => inBox(gap, x, y, z))) continue;
          g.set(x, y, z, BIRCH_PLANKS);
        }

  // bedroom-landing door (ROOMS: a birch_door at (11,9..10,15))
  g.set(11, 9, 15, ...B.door("birch", "east", "lower", "left"));
  g.set(11, 10, 15, ...B.door("birch", "east", "upper", "left"));

  // fireplace surrounds around the RESERVED fireboxes (1,5..6,z..z+2); the firebox itself stays air
  for (const z of [11, 20]) fireplaceSurround(g, z);

  // well railings: main-floor rim of the garage->main well, top-floor rim of the 2nd->top well
  for (let z = 21; z <= 23; z++) g.set(11, 5, z, ...B.fence("birch"));
  for (let z = 17; z <= 19; z++) g.set(11, 13, z, ...B.fence("birch"));
}

// Brick surround at x2..3, y5..7, z-1..z+3: a hearth brick_slab at (2,5), an open throat at (2,6) over the firebox,
// a smooth_quartz_slab mantel at (2,7) over the inner three cells. Bricks elsewhere in the surround.
function fireplaceSurround(g, z) {
  for (let zz = z - 1; zz <= z + 3; zz++) {
    const inner = zz >= z && zz <= z + 2;
    for (let y = 5; y <= 7; y++) {
      g.set(3, y, zz, BRICKS);
      if (!inner) { g.set(2, y, zz, BRICKS); continue; }
      if (y === 5) g.set(2, y, zz, ...B.slab("brick", "bottom"));
      else if (y === 6) continue;
      else g.set(2, y, zz, ...B.slab("smooth_quartz", "top"));
    }
  }
}
