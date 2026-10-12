// PART 5 car and front garden (plan.md, elements 20-22 and 21): the two-tone 50s car parked nose to the street on the
// driveway (x=3..5, z=1..7), two palms in the sand yard, a desert cactus cluster in the bed x=23..29 z=2..4, a few
// dead bushes on the front-yard sand, and the low mailbox at the head of the drive. Writes only into air; the sand,
// gravel beds and paving are the site part's cells, the car's cells are reserved for it here.
import { car_50s, palm, saguaro, barrel_cactus, mailbox, garden_lamp } from "../vocab.mjs";

// dead bushes on the bare front-yard sand: clear of the gravel beds (x=10..16 and 22..30, z=1..5), the stepping pads
// and landing (x=18..20), the driveway (x=1..8), the mailbox (9,1) and the feature wall (x=11..17, z=7)
const DEAD_BUSH = [[17, 2], [21, 4], [13, 6], [25, 7], [31, 2]];

export function build(g) {
  // the car: body y=1, cabin y=2, nose north
  car_50s(g, 3, 1);

  // the two palms: trunks on sand, crowns at y=6..7 (the roof's eave cells at z=6 are skipped, they are already filled)
  palm(g, 12, 3);
  palm(g, 30, 4);

  // the cactus cluster on the gravel bed: a 3-high saguaro with its arm, a 2-high saguaro, and three barrel cacti
  saguaro(g, 26, 3, 3);
  saguaro(g, 24, 2, 2);
  barrel_cactus(g, 28, 2);
  barrel_cactus(g, 23, 4);
  barrel_cactus(g, 29, 4);

  for (const [x, z] of DEAD_BUSH) g.set(x, 1, z, "dead_bush");

  // the low mailbox at the head of the drive
  mailbox(g, 9, 1);

  // garden lamps for the dark outdoor strip: the west side strip (x=0) and the sidewalk and driveway's west edge, which
  // no other light reaches (light --y 1 showed these cells at 0). Posts stand on the sand and lawn, in air only.
  for (const [x, z] of [[0, 4], [0, 14], [0, 24], [0, 31], [6, 2], [32, 3]]) garden_lamp(g, x, z);
}
