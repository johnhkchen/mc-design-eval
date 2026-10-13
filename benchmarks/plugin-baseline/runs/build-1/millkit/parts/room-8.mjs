// Room: P3 back room (interior designer's part). Variant bedroom, inner air x40..43, y3..6, z14..16.
// Entered from the partition door (x42, z13) and the back door (x41, z17). Bed on the east wall (x43, z15..16, head south),
// dresser of barrels and a chest on the west wall, a fence-post table with a plate top and a dark oak chair by the bed.
// Light: a hanging lantern from the loft ceiling (x42, y6, z15) and a standing lantern on the dresser barrel.
// Lanes stay clear: x42 z14..16 (the partition-door cell and the path to the back door) and x41 z16 (the back-door cell).
import { layers, bed, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // floor y3: dresser (barrels, chest), table post, chair (stairs seat facing the table, back to the south)
  layers(g, [40, 3, 14], {
    "B": ["barrel", { facing: "up" }],
    "C": ["chest", { facing: "east" }],
    "F": ["dark_oak_fence", {}],
    "S": ["dark_oak_stairs", { facing: "south", half: "bottom" }],
  }, [
    "BF",     // z14: barrel at x40, table post at x41
    "BS",     // z15: barrel at x40, chair at x41
    "C",      // z16: chest at x40
  ]);

  // floor y4: flower pot on the barrel top, table plate, standing lantern on the second barrel
  layers(g, [40, 4, 14], {
    "Q": ["potted_poppy", {}],
    "P": ["oak_pressure_plate", {}],
    "L": ["lantern", { hanging: "false", waterlogged: "false" }],
  }, [
    "QP",     // z14: pot on the barrel, table plate
    "L",      // z15: standing lantern on the barrel
  ]);

  // bed: foot at x43 z15, head at x43 z16 (pillow end south, toward the back door side)
  bed(g, [43, 3, 15], "south", "red");

}
