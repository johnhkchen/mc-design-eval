// Part: room: Front porch (interior furnisher + lamplighter). Inner air is x=5..17, y=2..3, z=5..7; the lane is z=6 (kept
// clear end to end, west and east ends open) and x=13 (the step gap to the front door). Furniture stands on the back
// row z=7 against the bunkhouse wall: barrel and axe rack at the west end, a peg rail at head height, the bench by the
// door, a chopping stump and barrels at the east end. Light: the two porch lanterns (12,3,6) and (14,3,6) from fittings,
// plus two hanging lanterns on chains from the porch roof slab at (6,3,7) and (16,3,7).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up" }],
  S: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  T: ["spruce_log", { axis: "y" }],
  f: "spruce_fence",
  l: ["lantern", { hanging: "true" }],
  c: ["iron_chain", { axis: "y" }],
};

// Rows run along +x from x=5 to x=17; the first row is z=6 (the lane), the second z=7 (the back row).
export function build(g) {
  layers(g, [5, 2, 6], LEGEND, [
    // y=2 floor level: barrel, axe-rack post, bench by the door, chopping stump, barrels. The window sills (x=6,7,15,16
    // at y=2) and the shutters (x=8, 14 at y=3) are fittings' cells, so the post and stump sit on free cells beside them.
    [
      ".............",
      "b..f..SS.T..b",
    ],
    // y=3 head level: hanging lanterns and the peg rail
    [
      ".............",
      ".lf.ff.....l.",
    ],
    // y=4 chains up to the roof slab
    [
      ".............",
      ".c.........c.",
    ],
  ]);
}
