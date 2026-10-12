// PART 5 car and front garden (plan.md item 5): the parked two-tone 50s car on the driveway, two palms in the sand, the
// cactus bed on the gravel, dead bushes on the sand, and the low mailbox at the head of the driveway. The front faces
// north (-z), the street. Every write goes into air only, so the shell, site and roof cells already built are kept.
import { car_50s, palm, saguaro, barrel_cactus, mailbox } from "../vocab.mjs";

// One plant into air, as the vocab helpers do. Returns 1 if placed, 0 if the cell is already built.
function put(g, x, y, z, id) {
  if (!g.isAir(x, y, z)) return 0;
  g.set(x, y, z, id);
  return 1;
}

export function build(g) {
  // the car: nose to the street, body on the driveway at y=1, cabin at y=2
  car_50s(g, 3, 1, "north");
  // palms in the sand: trunk y=1..7 with a crown (cells the roof already holds are skipped)
  palm(g, 12, 3);
  palm(g, 30, 4);
  // cactus bed on the gravel: two saguaros and three barrel cacti
  saguaro(g, 26, 3, 3);
  saguaro(g, 24, 2, 2);
  barrel_cactus(g, 28, 2);
  barrel_cactus(g, 23, 4);
  barrel_cactus(g, 29, 4);
  // dead bushes on the open sand, south of the gravel beds and clear of the stepping pads
  for (const [x, z] of [[14, 7], [21, 7], [27, 7]]) put(g, x, 1, z, "dead_bush");
  // low mailbox at the head of the driveway
  mailbox(g, 9, 1, "east");
}
