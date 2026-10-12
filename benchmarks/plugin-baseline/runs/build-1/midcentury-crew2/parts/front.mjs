// PART 5 car and front garden: the two-tone 1950s car nose to the street on the driveway, two palms and the desert
// planting of the front yard (a saguaro and barrel cacti on the gravel bed, a dead bush on the sand), and the low
// mailbox at the head of the drive. Every helper writes only into air, so the earlier parts' blocks stay locked.
import { car_50s, palm, saguaro, barrel_cactus, mailbox, CAR, PALMS, MAILBOX } from "../vocab.mjs";

// one plant cell on the sand (dead_bush is not a helper): air only
const plant = (g, x, y, z, block) => { if (g.isAir(x, y, z)) g.set(x, y, z, block); };

export function build(g) {
  // 20: the car, nose north (to the street), x=3..5 z=1..7
  car_50s(g, CAR.x, CAR.z, "north");
  // 21: palms in the front yard; the crown of (30,4) skips the roof cells already filled
  palm(g, PALMS[0][0], PALMS[0][1]);
  palm(g, PALMS[1][0], PALMS[1][1]);
  // 21: cactus cluster on the gravel bed x=23..29 z=2..4
  saguaro(g, 26, 3, 3);
  saguaro(g, 24, 2, 2);
  barrel_cactus(g, 28, 2);
  barrel_cactus(g, 23, 4);
  barrel_cactus(g, 29, 4);
  // 21: dead bushes on the sand, one between the entry pads and one by the landing
  plant(g, 32, 1, 3, "dead_bush");
  plant(g, 21, 1, 6, "dead_bush");
  // 22: low mailbox at the head of the driveway
  mailbox(g, MAILBOX.x, MAILBOX.z, "east");
}
