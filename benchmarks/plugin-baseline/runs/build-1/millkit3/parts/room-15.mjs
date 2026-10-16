// P2 front bedroom: upper front bedroom, box x28..30 y8..11 z10..12 (floor y8). Two yellow beds on the west wall
// (heads at x28, z10 and z11, feet at x29), a barrel dresser at the back corner (28, z12) with a lantern standing on
// it as the bedside lamp. Entries: door (31, 8..9, 10) from the landing, door (29, 8..9, 13) to the back bedroom.
// The lane (30,10)-(30,12)-(29,12) stays clear from the east door to the south door.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Two beds, both whole: foot at x29, head one step west at x28, against the west wall (x27 is solid here).
  bed(g, [29, 8, 10], "west", "yellow");
  bed(g, [29, 8, 11], "west", "yellow");

  // Dresser and lamp: a barrel against the west wall at the back corner (28, 8, 12), a lantern standing on its top.
  // Rows run along +x (x28..30), successive rows along +z (z10..12), one layer per storey.
  layers(g, [28, 8, 10], { B: ["barrel", { facing: "up" }] }, [
    ["...", "...", "B.."],
  ]);
  layers(g, [28, 9, 10], { L: ["lantern", { hanging: "false" }] }, [
    ["...", "...", "L.."],
  ]);
}
