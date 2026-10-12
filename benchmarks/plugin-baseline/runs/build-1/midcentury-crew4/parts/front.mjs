// PART 5 car and front garden (plan.md ELEMENTS 20-22): the two-tone 1950s car on the driveway (x=3..5, z=1..7),
// two palms, a saguaro and barrel cactus cluster on the gravel bed (x=23..29, z=2..4), dead bushes on the front sand,
// and the low mailbox at the head of the drive. Only air is written (the vocabulary helpers skip anything built),
// and nothing is written at y=0: the sand, gravel and driveway paving belong to the site part.
import { car_50s, palm, saguaro, barrel_cactus, mailbox } from "../vocab.mjs";

// sand cells in the front yard, clear of the gravel beds, cacti, palms, stepping pads and the landing
const DEAD_BUSHES = [[17, 2], [21, 6], [31, 6], [33, 2]];

export function build(g) {
  const reports = [];
  reports.push(car_50s(g, 3, 1));
  reports.push(palm(g, 12, 3));
  reports.push(palm(g, 30, 4));
  reports.push(saguaro(g, 26, 3, 3));
  reports.push(saguaro(g, 24, 2, 2));
  reports.push(barrel_cactus(g, 28, 2));
  reports.push(barrel_cactus(g, 23, 4));
  reports.push(barrel_cactus(g, 29, 4));
  for (const [x, z] of DEAD_BUSHES) if (g.isAir(x, 1, z)) g.set(x, 1, z, "dead_bush");
  reports.push(mailbox(g, 9, 1));
  return reports;
}
