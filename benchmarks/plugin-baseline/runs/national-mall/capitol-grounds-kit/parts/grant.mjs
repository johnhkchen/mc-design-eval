// Grant Memorial and statues (plan.md part 4): platform, pedestal, horseman, lions, groups, small statues.
import {
  memorialPlatform, pedestal, bronzeHorseman, lionCouchant, cavalryGroup, artilleryGroup, smallStatue,
} from "../vocab.mjs";

// Platform: x60..66, z67..89, base course y4, top y6; the steps sit at z74..82 and the two groups stand on the
// platform top at the north (z67..71) and south (z85..89) ends, so their rim is left open.
const PLATFORM = { x0: 60, z0: 67, x1: 66, z1: 89, y0: 4, topY: 6, stepZ: [74, 82], open: [[61, 67, 65, 71], [61, 85, 65, 89]] };

export function build(g) {
  // the platform: marble box, diorite base course, slab rim with glowstone under it
  memorialPlatform(g, PLATFORM);
  // the step cells at y5 are full marble, not bottom slabs: a bottom slab under the y6 top leaves air beneath it
  for (let z = 74; z <= 82; z++) for (const x of [60, 66]) g.set(x, 5, z, "smooth_quartz");

  // Grant: a quartz pedestal (y7..10) with a blackstone course at y11; the horseman stands on it at y12
  pedestal(g, 62, 77, 64, 79, 7, 11);
  bronzeHorseman(g, 63, 12, 78, "west");

  // four lions couchant on the platform top, heads outward from the pedestal
  lionCouchant(g, 61, 7, 75, "east");
  lionCouchant(g, 65, 7, 75, "west");
  lionCouchant(g, 61, 7, 81, "east");
  lionCouchant(g, 65, 7, 81, "west");

  // the end groups on the platform top
  cavalryGroup(g, 61, 67, 65, 71, 7);
  artilleryGroup(g, 61, 7, 85);

  // small statues: P (Peace Monument side), g (Grant-side plinth), p, J (Garfield)
  smallStatue(g, 62, 62, "P");
  smallStatue(g, 63, 48, "g");
  smallStatue(g, 83, 21, "p");
  smallStatue(g, 84, 99, "J");
}
