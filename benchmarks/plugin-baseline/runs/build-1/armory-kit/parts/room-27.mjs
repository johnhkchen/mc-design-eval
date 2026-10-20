// Interior designer for "Gallery two" (room 27): a dark exhibition room. Focal piece: a stained-glass sculpture on a
// deepslate plinth on the axis of the two doorways (x 274..277). Benches as stairs against the side walls, sea-lantern
// pedestals for pools of light along the lanes. Inside the box [259,1,31,294,10,59] only; never over a doorway.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // focal plinth: 3x3 polished deepslate at x 275..277, z 44..46 (the doorway axis; lanes run round it)
  g.fill([275, 1, 44], [277, 1, 46], "polished_deepslate");

  // the sculpture on the plinth: y2 base (sea lanterns on the corners light it), y3..4 the glass cluster
  layers(g, [275, 2, 44], {
    "s": "sea_lantern",
    "o": "orange_stained_glass",
    "r": "red_stained_glass",
    "y": "yellow_stained_glass",
  }, [
    ["sys", "oro", "sos"],
  ]);
  layers(g, [275, 3, 44], {
    "o": "orange_stained_glass",
    "r": "red_stained_glass",
    "y": "yellow_stained_glass",
    "g": "glass",
  }, [
    [".r.", "rgy", ".o."],
  ]);
  layers(g, [275, 4, 44], {
    "o": "orange_stained_glass",
  }, [
    ["...", ".o.", "..."],
  ]);
  g.set(276, 5, 45, "end_rod");

  // benches: deepslate-tile stairs with their backs to the side walls, seats into the room
  for (const z of [37, 38, 39]) g.set(259, 1, z, ...B.stairs("deepslate_tile", "west"));
  for (const z of [50, 51, 52]) g.set(294, 1, z, ...B.stairs("deepslate_tile", "east"));

  // pedestal lights: a deepslate block with a sea lantern on top, for pools of light along the lanes
  for (const [x, z] of [[263, 35], [290, 35], [263, 55], [290, 55]]) {
    g.set(x, 1, z, "polished_deepslate");
    g.set(x, 2, z, "sea_lantern");
  }
  // standing lanterns on the floor beside the benches and the west corner: they clear the dark cells the tool found
  for (const [x, z] of [[293, 50], [259, 40], [263, 54], [289, 35], [275, 47], [264, 35], [289, 55], [275, 43], [264, 54], [278, 44], [265, 54], [275, 48]]) g.set(x, 1, z, ...B.lantern(false));
}
