// Room "P7 north-west bedroom" (interior designer's part): box x116..119, y6..8, z14..17. Door in the east wall at
// (120,6..7,16); window pair in the north wall above x115..116. Two twin beds with their heads on the solid north wall
// (red at x117, blue at x119, feet toward the room at z15), a barrel nightstand between them at (118,14) carrying the
// room's lantern, the dresser (chest + barrel) under the window on the west side, a brown rug on the floor in front of
// the beds at x117..118 z16..17. Floor cells stay reachable from the door along x118 and x116..117 at z16..17.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the beds: foot, then the head one step toward facing (the pillow end against the north wall)
  bed(g, [117, 6, 15], "north", "red");
  bed(g, [119, 6, 15], "north", "blue");

  // y6 floor layer, rows along +z from z14 (north) to z17, columns x116..119
  // C chest (facing into the room), B barrel (dresser / nightstand), R brown carpet rug; the beds are placed by bed()
  // y7 layer: P potted poppy on the chest, L lantern standing on the nightstand barrel (the room's light)
  layers(g, [116, 6, 14], {
    "C": ["chest", { facing: "south" }],
    "B": "barrel",
    "R": "brown_carpet",
    "P": "potted_poppy",
    "L": ["lantern", { hanging: "false" }],
  }, [
    [
      "C B ",   // z14: dresser chest under the window, barrel nightstand between the bed heads
      "B   ",   // z15: barrel dresser on the west wall, the bed feet
      " RR ",   // z16: rug, the lane from the door runs along it
      " RR ",   // z17: rug
    ],
    [
      "P L ",   // z14: pot on the chest, lantern on the nightstand barrel
      "    ",
      "    ",
      "    ",
    ],
  ]);
}
