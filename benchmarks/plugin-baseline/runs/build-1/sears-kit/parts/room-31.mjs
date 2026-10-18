// Room "P4 hall" (interior designer's part): the 1-wide entry hall x72, z14..20, feet y2, inner air y2..4.
// The hall is a corridor: nothing stands in its lane (z14..20 at y2..3). The focal piece is a coat stand (spruce fence
// post with a standing lantern on top) at the far end z20, where the door's line of sight ends. Light: two hanging
// lanterns from the ceiling (y5) at z15 and z19, clear of the z18 doorway cell.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // rows run along z (14..20), one column at x72; layers run up from y2 (feet) to y4 (ceiling clearance)
  layers(g, [72, 2, 14], {
    "F": "spruce_fence",
    "L": ["lantern", { hanging: "false" }],
    "H": ["lantern", { hanging: "true" }],
  }, [
    // y2: feet level: the coat stand post at z20
    [" ", " ", " ", " ", " ", " ", "F"],
    // y3: lantern standing on the post (z20), and the lane stays clear
    [" ", " ", " ", " ", " ", " ", "L"],
    // y4: hanging lanterns from the ceiling at z15 and z19
    [" ", "H", " ", " ", " ", "H", " "],
  ]);
}
