// Part 2, Stairs and ladders (stair joiner): stair 1 (lobby to store) and stair 2 (store to loft) at plan.md's RESERVED cells.
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stairFlight, hatchLadder } from "../vocab.mjs";

export function build(g) {
  // floor openings first (flight plus one), then the flights
  carve(g, [3, 12, 12], [4, 12, 19]);
  carve(g, [3, 18, 23], [4, 18, 28]);
  // stair 1: x3..4, 7 treads z13..19 y5..11 rising south, landing y12 z20..21; rail on the east side
  stairFlight(g, 3, 5, 13, "south", 7, { rail: "east" });
  // stair 2: 5 treads z24..28 y13..17, landing y18 z29..30
  stairFlight(g, 3, 13, 24, "south", 5, { rail: "east" });
  // rails round the openings on the floor above (top step stays open to the south)
  const f = (x, y, z, s) => g.set(x, y, z, "dark_oak_fence", s);
  const ns = { north: "true", south: "true", east: "false", west: "false" };
  for (let z = 12; z <= 19; z++) if (z !== 14) f(5, 13, z, ns);
  for (let z = 23; z <= 28; z++) f(5, 19, z, ns);
  f(3, 13, 12, { north: "false", south: "false", east: "false", west: "false" });
  // keeper ladders from the gallery hatches down into the pockets
  for (const x of [11, 19, 27]) { hatchLadder(g, x, 16, "south"); g.set(x, 12, 16, "dark_oak_trapdoor", { facing: "south", half: "top", open: "true", powered: "false", waterlogged: "false" }); }
  for (const x of [15, 23, 31]) { hatchLadder(g, x, 21, "north"); g.set(x, 12, 21, "dark_oak_trapdoor", { facing: "north", half: "top", open: "true", powered: "false", waterlogged: "false" }); }
}
