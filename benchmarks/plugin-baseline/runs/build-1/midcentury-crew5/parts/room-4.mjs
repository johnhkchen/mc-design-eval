// ROOM living (interior designer): the show room. Inner air box [11,2,19,21,4,24]. The conversation pit sinks to y=0
// (its rim is smooth_quartz at y=1, the floor slab level); the freestanding fireplace at x=20..21 z=21..22 belongs to the
// roof part and is kept clear. Paths: from the dining opening (z=18, x=11..15) and the atrium doors (x=19..20, z=18) into
// the room, to the corridor doorway (x=22, z=19..20) and the south sliders (x=14..15 and x=20..21, z=25).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { egg_chair, sofa_low, sideboard, panel_wall, hung_lantern } from "../vocab.mjs";

export function build(g) {
  // sunken pit: rim benches at y=1 facing inward, orange cushions and a low table on the pit floor (y=1 standing)
  // x=11..21 (columns), z=19..24 (rows); '.' is left alone
  layers(g, [11, 1, 19], {
    C: ["smooth_quartz_slab", { type: "bottom" }],
    N: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
    S: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
    W: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }],
    E: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }],
    K: ["orange_carpet", {}],
    T: ["spruce_slab", { type: "bottom" }],
  }, [
    "...........",
    "..CNNNC....",
    "..WKKKE....",
    "..WKTKE....",
    "..CSSSC....",
    "...........",
  ]);

  // two low orange sofas: one along the west side of the pit, one along the south side facing the garden glass
  sofa_low(g, 12, 20, 4, "z", "east");
  sofa_low(g, 16, 24, 3, "x", "south");

  // egg chair by the atrium glass (north row), seat facing the atrium
  egg_chair(g, 16, 19, "south");

  // sideboard on the south-west corner, fronts to the room; spruce panelling on the x=22 partition
  sideboard(g, 11, 24, 2, "x", "north");
  panel_wall(g, 21, 23, 2, 4, "east");

  // floor lamp: spruce fence post with a lantern on top, in the north-west corner
  g.set(11, 2, 19, "spruce_fence");
  g.set(11, 3, 19, ...B.lantern(false));

  // hung lanterns under the beams at x=13, 16, 19 (beam at y=5 above each): the pit, the seating and the path lit
  for (const [x, z] of [[13, 19], [19, 19], [16, 21], [16, 24], [13, 23], [19, 23]]) hung_lantern(g, x, 4, z);
  // a standing lantern on the floor by the garden sliders, where the hung ones don't reach
  g.set(19, 2, 24, ...B.lantern(false));
}
