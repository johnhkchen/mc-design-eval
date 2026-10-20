// NASM glass bays (part 2, plan E4 and E6): the three glass galleries between the marble cubes, the two iron door pairs
// in G2's north and south faces, and the entrance steps and landing in front of G2. The shell has already built the
// podium and left the bay face rows free, so the bays' sills and walls write only into air.
import { glass_bay, door_pair, entry_steps } from "../vocab.mjs";

// x0, x1, z0, z1 (plan SITE table). G2's mullions are the door frame: x 41 and 46 double as the mullions.
const BAYS = [
  { x0: 15, x1: 24, z0: 5, z1: 25 },                                 // G1
  { x0: 38, x1: 49, z0: 6, z1: 24, mullions: [38, 41, 46, 49] },     // G2, central entrance bay
  { x0: 63, x1: 72, z0: 5, z1: 25 },                                 // G3
];

export function build(g) {
  for (const { x0, x1, z0, z1, mullions } of BAYS) glass_bay(g, x0, x1, z0, z1, mullions ? { mullions } : {});

  // G2 doors: x 42..45, y 2..3, in the north face (z 6) and the south face (z 24). Each door_pair takes the glass
  // cells of its own two columns (over), then the blackstone lintel goes across y 4 over the doors.
  for (const z of [6, 24]) {
    const facing = z === 6 ? "north" : "south";
    if (z === 6) {
      door_pair(g, 42, 2, z, facing, "iron_door", { over: true });
      door_pair(g, 44, 2, z, facing, "iron_door", { over: true });
    } else {
      door_pair(g, 43, 2, z, facing, "iron_door", { over: true });
      door_pair(g, 45, 2, z, facing, "iron_door", { over: true });
    }
    for (let x = 42; x <= 45; x++) g.set(x, 4, z, "polished_blackstone");
  }

  // entrance steps: a bottom slab row at z 3 (one half step from grade), then the level landing z 4..5 at y 1
  entry_steps(g, 38, 49, 3, 4, 5);
}
