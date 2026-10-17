// Part: room: church belfry (interior designer). The bell stage is a 2x2 air room, x 52..53, z 10..11, y 16..17.
// The bell (52, 17, 10) hangs from the y18 deck and is the focal piece (built by the tower shell). The ladder comes up
// through the hole at (52, 15, 11) onto (52, 16, 11). The bell takes the head room over (52, 16, 10) and the ladder
// foot the floor under (52, 16, 11), so the one walkable floor cell the climb reaches is (53, 16, 11): it stays clear,
// with its head room. Furnished: a barrel of ringing supplies in the far corner, and a standing lantern on its top
// beside the bell (the light, lit next to the focal piece). Nothing hangs over (53, 16, 11).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Origin is the room's low corner (52, 16, 10). Rows run along +x, successive rows along +z.
  layers(g, [52, 16, 10], {
    L: ["lantern", { hanging: "false" }],
    b: "barrel",
  }, [
    // y 16: the floor layer. The barrel takes (53, 16, 10); (52, 16, *) and (53, 16, 11) stay walkable.
    [
      ".b",
      "..",
    ],
    // y 17: the lantern stands on the barrel's top, beside the bell's cell (52, 17, 10), which is left alone.
    [
      " L",
      "  ",
    ],
  ]);
}
