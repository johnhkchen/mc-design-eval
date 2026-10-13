// Part 3: colonnade and galleries. Colossal columns, the double gallery floors and ceiling, balustrades on both floors,
// the entablature band, the gallery's hanging lanterns, the rear porch with its slim columns, and the two garden stoops.
// Plan coordinates from plan.md (FRONT GALLERY, FACADES north, RESERVED P-col / P-cap, REAR PORCH, garden door stoop).
import { colossalColumn, galleryFloor, balustrade, porchLantern, rearPorch, stoop } from "../vocab.mjs";

// the eight 2x2 colossal columns, x anchors (each occupies x..x+1 and z35..36)
const COLUMN_X = [25, 31, 37, 43, 51, 57, 63, 69];
const COLUMN_Z = 35;

// the gallery's ground and upper balustrade runs between the columns (plan: FACADES north, balustrade row).
// The ground rail skips the steps at x45..50.
const UPPER_RUNS = [[27, 30], [33, 36], [39, 42], [45, 50], [53, 56], [59, 62], [65, 68]];
const GROUND_RUNS = [[27, 30], [33, 36], [39, 42], [53, 56], [59, 62], [65, 68]];

// balustrade along z at the gallery ends (x25 and x70, z37..41), the fence joining along z
function endRail(g, x, z0, z1, y) {
  for (let z = z0; z <= z1; z++) {
    g.set(x, y, z, "birch_fence", { north: String(z > z0), south: String(z < z1), east: "false", west: "false", waterlogged: "false" });
    g.set(x, y + 1, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

export function build(g) {
  // 1. the eight colossal columns; the end columns also flare their capitals outward to the west / east
  COLUMN_X.forEach((x) => {
    const volutes = x === 25 ? ["north", "south", "west"] : x === 69 ? ["north", "south", "east"] : ["north", "south"];
    colossalColumn(g, x, COLUMN_Z, { base: 4, volutes });
  });

  // 2. galleries: ground floor y3, upper deck y10 (smooth_quartz edge at z35), ceiling y17; the floor runs under the columns
  galleryFloor(g, 25, COLUMN_Z, 70, 41, { skip: COLUMN_X.map((x) => [x, COLUMN_Z]) });

  // 3. upper balustrade (birch fence y11 with a quartz slab top at y12) between the columns, and on the gallery ends
  for (const [a, b] of UPPER_RUNS) balustrade(g, a, b, COLUMN_Z, 11);
  endRail(g, 25, 37, 41, 11);
  endRail(g, 70, 37, 41, 11);

  // 4. ground-floor rail (fence y4, slab y5) between the columns, open at the steps x45..50, and on the ground ends
  for (const [a, b] of GROUND_RUNS) balustrade(g, a, b, COLUMN_Z, 4);
  endRail(g, 25, 37, 41, 4);
  endRail(g, 70, 37, 41, 4);

  // 5. entablature: the y17 band (x25..70 is the gallery ceiling from galleryFloor). The x24 / x71 ends are already
  //    deepslate tiles from the roof's eave, so the band is not repeated there.

  // 6. hanging lanterns under the gallery ceilings: ground gallery under the deck (chain y9, lantern y8),
  //    upper gallery under the ceiling (chain y16, lantern y15), on the centre line of the entrance bay
  porchLantern(g, 47, 9, 38);
  porchLantern(g, 47, 16, 38);

  // 7. rear porch: floor y3, six slim quartz columns, beam, shed roof, three steps down to the lawn (the wing wall at z75)
  rearPorch(g, 37, 58, 75, 79, { y0: 3, posts: 6 });

  // 8. garden door stoops: west landing at x25 facing east toward the door, east landing at x70 facing west
  stoop(g, 25, 50, "east", { y: 3, width: 4 });
  stoop(g, 70, 50, "west", { y: 3, width: 4 });
}
