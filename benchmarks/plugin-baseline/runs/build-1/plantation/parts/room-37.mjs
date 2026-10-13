// Part: room: greenhouse (interior furnisher + lamplighter). Inner air x5..20, z65..74, y1..8 (plan.md FLOORS, rooms.json).
// Focal piece: the potting wall along the west end, in line with the east door: a fence-and-top-slab bench with pots and
// standing lanterns. Planting benches run along both long walls; water barrels and a water tub sit in the east corners;
// a potting stool stands in the middle; hanging lanterns come off chains under the ridge. The gravel floor (y0) and the
// glass shell belong to the grounds part; the lane z69..70 from the east door stays clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN_X = 5;
const ORIGIN_Z = 65;
const WIDTH = 16; // x5..20

const LEGEND = {
  f: "dark_oak_fence", // bench legs and the potting-wall posts (connections set after)
  t: ["dark_oak_slab", { type: "top" }], // bench tops: the fence is 1.5 high, so the top slab sits on it at y2
  p: "flower_pot",
  l: ["lantern", { hanging: "false" }], // stands on a top slab
  h: ["lantern", { hanging: "true" }], // hangs from the chain above it
  c: ["iron_chain", { axis: "y" }],
  b: "barrel",
  w: ["water_cauldron", { level: "3" }],
  s: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // potting stool
};

// Rows run along +x (x5..x20), successive rows along +z (z65..z74). Short rows are padded with air ('.').
const pad = (rows) => rows.map((r) => r.padEnd(WIDTH, "."));

// y1: floor level. Fences under the benches, barrels and cauldron in the east corners, the stool, the west posts.
// The rows z66 and z73 are the greenhouse's own low slab benches (smooth_quartz_slab x5..20 at y1): no fence there, so
// the lanterns stand on the bench at y2 and the x5 bench top and pot (which would float without a fence) are dropped.
const Y1 = pad([
  "..ffffff.fffffbw",
  "",
  "f",
  "f",
  "f",
  "f...s",
  "f",
  "f",
  "",
  "..ffffff.fffffbw",
]);

// y2: bench tops (top slabs on the fences), the west table top, a pot on each east barrel. The slab benches (z66, z73)
// carry no lanterns here: a lantern on a bottom slab floats half a block (the lamplighter's floor lamps light them instead).
const Y2 = pad([
  "..tttttt.tttttp",
  "",
  "t",
  "t",
  "t",
  "t",
  "t",
  "t",
  "",
  "..tttttt.tttttp",
]);

// y3: things standing on the tops: pots and standing lanterns on the potting wall and the benches.
const Y3 = pad([
  "..p.l.p..p.p",
  "",
  "l",
  "p",
  "p",
  "l",
  "p",
  "p",
  "",
  "...p...p..l..p",
]);

// y7 and y8: the hanging lantern (y7) under its chain (y8), over the lane at z69 (x9 and x16).
const Y7 = pad(["", "", "", "", "....h......h"]);
const Y8 = pad(["", "", "", "", "....c......c"]);

export function build(g) {
  layers(g, [ORIGIN_X, 1, ORIGIN_Z], LEGEND, Y1);
  layers(g, [ORIGIN_X, 2, ORIGIN_Z], LEGEND, Y2);
  layers(g, [ORIGIN_X, 3, ORIGIN_Z], LEGEND, Y3);
  layers(g, [ORIGIN_X, 7, ORIGIN_Z], LEGEND, Y7);
  layers(g, [ORIGIN_X, 8, ORIGIN_Z], LEGEND, Y8);

  // Fence posts join their neighbours: read the connections from the y1 layer (layers() writes plain posts).
  const isFence = (j, i) => Y1[j]?.[i] === "f";
  for (let j = 0; j < Y1.length; j++) {
    for (let i = 0; i < WIDTH; i++) {
      if (!isFence(j, i)) continue;
      const state = {
        north: String(isFence(j - 1, i)),
        south: String(isFence(j + 1, i)),
        east: String(isFence(j, i + 1)),
        west: String(isFence(j, i - 1)),
      };
      g.set(ORIGIN_X + i, 1, ORIGIN_Z + j, "dark_oak_fence", state);
    }
  }

  // Lamplighter: standing lanterns, none in the east-door lane (z69..70). Floor lamps stand on the gravel (y0) and clear
  // the dim cells at x11 z69, x20 z69 and x8 z74; the south one stands on a bench top at y3 (the potting-stool row).
  g.set(11, 1, 67, "lantern", { hanging: "false" });
  g.set(19, 1, 71, "lantern", { hanging: "false" });
  g.set(9, 3, 74, "lantern", { hanging: "false" });
  g.set(17, 3, 65, "lantern", { hanging: "false" }); // north-east bench top: lifts the corner cells at x17..20 z65
}
