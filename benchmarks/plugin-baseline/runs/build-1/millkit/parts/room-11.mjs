// Room: Store counter and stock (interior designer's part). Inner air x86..93, y3..7, z13..16 (plan.md FLOORS).
// Focal piece: the counter (z13, x86..91), facing the sales floor doorway. The shopkeeper works on z14 behind it.
// Lanes: x92 from the sales floor (z13) to the back door cell (x93 z16); z15 x86..91 is the work lane to the job sites.
// Job sites on the back wall z16: composter 86, smoker 87, barrel 88, barrel 89 (lantern), loom 90, fletching table 91.
// The plan had the loom at 92 and fletching table at 93, but x93 z16 is the back door's first cell (kept clear).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y 3 (floor level). '.' is air and is left as it is.
  //   c dark_oak_planks counter body   b barrel (facing up)   h chest (facing west)
  //   p composter   m smoker (lit, facing north)   l loom   f fletching_table
  layers(g, [86, 3, 13], {
    c: "dark_oak_planks",
    b: ["barrel", { facing: "up" }],
    h: ["chest", { facing: "west" }],
    p: ["composter", { level: "4" }],
    m: ["smoker", { facing: "north", lit: "true" }],
    l: ["loom", { facing: "north" }],
    f: "fletching_table",
  }, [
    ["cccccc.b",   // z13: counter x86..91, passage x92, barrel x93
     "b......b",   // z14: crate base x86, shopkeeper lane, barrel x93
     ".......h",   // z15: work lane, chest x93
     "pmbblf.."],  // z16: job sites x86..91, door cell x93 clear
  ]);

  // y 4: counter cap (bottom slab on the body), crate top chest at x86 z14.
  layers(g, [86, 4, 13], {
    s: "dark_oak_slab",
    h: ["chest", { facing: "west" }],
  }, [
    ["ssssss..",
     "h.......",
     "........",
     "........"],
  ]);

  // Lanterns standing on the tops of the stock: crate stack (86,5,14), barrel (93,4,13), barrel (89,4,16).
  g.set(86, 5, 14, ...B.lantern(false));
  g.set(93, 4, 13, ...B.lantern(false));
  g.set(89, 4, 16, ...B.lantern(false));
}
