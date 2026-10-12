// room: Bathroom (plan.md ROOMS: [10,9,25,13,11,31], spruce_planks floor at y8, entered from the landing doorway at z24).
// Victorian bathroom: clawfoot tub on the party wall (x10), a quartz pillar basin with a cauldron, a quartz stair toilet
// on the east wall, a towel rack, white carpet and two hanging lanterns. The window (11,10..11,32) stays clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { QUARTZ_PILLAR, WHITE_CARPET, WHITE_WOOL, BIRCH_FENCE, CAULDRON, LANTERN, clawfootTub } from "../vocab.mjs";

export function build(g) {
  // clawfoot tub: two quartz stairs along z on the party wall x10, z26..27
  clawfootTub(g, 10, 9, 26, "z", 2);

  // basin: a quartz pillar at (10,9,30) with a water cauldron on top
  g.set(10, 9, 30, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(10, 10, 30, CAULDRON);

  // toilet-like quartz stair against the east wall, facing into the room
  g.set(13, 9, 26, ...B.stairs("quartz", "west", "bottom"));

  // linen barrel against the east wall
  g.set(13, 9, 28, "barrel", { facing: "up", open: "false" });

  // towel rack: a birch fence post with a white wool towel over it, clear of the window and the doorway path
  g.set(13, 9, 31, BIRCH_FENCE, { north: "false", south: "false", east: "false", west: "false" });
  g.set(13, 10, 31, WHITE_WOOL);

  // white carpet rug on the floor between the fixtures (the walk path stays on the carpet's edges)
  g.fill([11, 9, 27], [12, 9, 28], WHITE_CARPET);

  // two hanging lanterns from the ceiling (y12): over the tub, and over the basin and toilet
  g.set(11, 11, 27, LANTERN, { hanging: "true", waterlogged: "false" });
  g.set(12, 11, 30, LANTERN, { hanging: "true", waterlogged: "false" });
}
