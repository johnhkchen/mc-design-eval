// Part: room: I-house upper hall (interior furnisher + lamplighter). Box 29,8,10 .. 30,11,15.
// The stair joiner's flight (x30, z10..14) and rail (x29, z10..13) are locked; the landing is x29..30 z14..15.
// Only the two free cells of the landing's far end (z15) are furnished, and z14 stays clear: the stair top steps out
// west onto x29 z14, and the walk from the flight must never be blocked.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Coat post at the south corner: a spruce fence post with a lantern on it (the hall's focal light).
  g.set(29, 8, 15, ...B.fence("spruce"));
  g.set(29, 9, 15, ...B.lantern(false));

  // Dresser at the south corner: a barrel with a lantern standing on its top.
  g.set(30, 8, 15, "barrel", { facing: "up" });
  g.set(30, 9, 15, ...B.lantern(false));
}
