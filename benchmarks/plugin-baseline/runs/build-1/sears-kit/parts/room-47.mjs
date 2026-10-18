// Room "P6 west bedroom" (interior designer's part): inner air x101..104, y2..4, z20..21. A 4 x 2 back bedroom.
// Two beds with their heads on the solid partition z19 (x101, x102), feet toward the back wall z21. The doorway
// (104, 2..3, 19) opens onto (104, 2, 20); the lane (104,20) -> (103,20) -> (103,21) stays clear to both beds. The
// dresser (a chest on the corner cell (104, 2, 21)) carries a standing lantern: the room's one light, lit from the
// corner so no floor cell is dark. Nothing over the doorway or the windows on the west wall x100.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the two beds: foot at z21, head one step north at z20, heads against the solid partition z19
  bed(g, [101, 2, 21], "north", "red");
  bed(g, [102, 2, 21], "north", "red");

  // the dresser and its lamp: chest at feet level on (104, 2, 21), lantern standing on its top at (104, 3, 21)
  layers(g, [101, 2, 20], {
    "c": ["chest", { facing: "west", type: "single" }],
  }, [
    ["    ", "   c"],
  ]);
  layers(g, [101, 3, 20], {
    "L": ["lantern", { hanging: "false" }],
  }, [
    ["    ", "   L"],
  ]);
}
