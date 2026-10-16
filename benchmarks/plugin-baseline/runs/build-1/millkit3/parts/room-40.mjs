// P7 west bedroom front: upper front bedroom, bed head on the west wall (x85), gallery door at (88,8..9,9).
// Inner air box 86..88 x 8..11 x 10..12. Ways in: the stair top (88,8,11), the gallery door (88,8,9) via (88,8,10),
// and the partition door (86,8,13) via (86,8,12). The lane keeps (88,10), (88,11), (87,11), (87,12), (86,12) clear.
// Furniture: one red bed (head west, against the solid wall at x85 z10), a barrel nightstand at (86,8,11) with a
// standing lantern on it (the room's light, next to the pillow). The stair and the gallery door are not touched.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // bed(): foot (87,8,10), head one step west at (86,8,10); both halves, two clear above.
  bed(g, [87, 8, 10], "west", "red");

  // y8: nightstand barrel (86,8,11); y9: standing lantern on its top (86,9,11).
  layers(g, [86, 8, 10], { B: "barrel", L: ["lantern", { hanging: "false" }] }, [
    [
      "   ",
      "B  ",
      "   ",
    ],
    [
      "   ",
      "L  ",
      "   ",
    ],
  ]);
}
