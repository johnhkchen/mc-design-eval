// Room: P3 front room (v2: a sleeping front room). Inner air x40..43, y3..6, z10..12; front doors x41..42 at z9, partition door
// x42 at z13. Two beds head to the front wall at x40 and x43 (z10..11); lane x41..42 stays clear. The lit smoker (40,3,12) is the
// Hearths part's. A dark oak table-and-barrel corner at x43 z12 with a standing lantern.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  bed(g, [40, 3, 11], "north", "white");
  bed(g, [43, 3, 11], "north", "red");
  layers(g, [43, 3, 12], { B: ["barrel", { facing: "up" }], L: ["lantern", { hanging: "false" }] }, [["B"], ["L"]]);
}
