// Room: Gallery landing (upper hall over the foyer void). Inner air x24..29 y6..8 z17..24 (plan.md ROOMS).
// Entered from the stair top (24..25,6,16) and the doors (23,6..7,18) west and (30,6..7,18) east.
// Layout: the banister (dark oak fence) runs along the void edge z=17 x26..29 and the stair mouth (24..25,17) stays open;
// the z=18 row is kept clear so both doors meet the stair. Seating and display sit on the south half: an oak-stair bench
// against the west wall, a quartz side table, a quartz pedestal with a lantern as the focal piece on the window axis,
// and a topiary corner. Hanging lanterns on the y9 ceiling give the light; no object sits over a door or window.
import { B } from "../vocab.mjs";

const BANISTER = "dark_oak_fence";

export function build(g) {
  // banister: fences along the void edge, connected to their neighbours in the row
  const rail = [
    [26, { east: "true", west: "false" }],
    [27, { east: "true", west: "true" }],
    [28, { east: "true", west: "true" }],
    [29, { east: "false", west: "true" }],
  ];
  for (const [x, conn] of rail) {
    g.set(x, 6, 17, BANISTER, { north: "false", south: "false", waterlogged: "false", ...conn });
  }

  // bench: two oak stairs as seats, backs against the west wall (x=23), facing into the room (east)
  g.set(24, 6, 20, ...B.stairs("oak", "east", "bottom"));
  g.set(24, 6, 21, ...B.stairs("oak", "east", "bottom"));

  // side table: quartz pillar leg, slab top
  g.set(25, 6, 22, ...B.pillar("quartz_pillar", "y"));
  g.set(25, 7, 22, ...B.slab("smooth_quartz", "bottom"));

  // focal piece: quartz pedestal with a standing lantern, centred on the palladian window (x25..28, z=25)
  g.set(27, 6, 23, "chiseled_quartz_block");
  g.set(27, 7, 23, ...B.lantern(false));

  // plant in the back corner
  g.set(29, 6, 24, "azalea_leaves", { persistent: "true", distance: "7", waterlogged: "false" });

  // light: hanging lanterns from the y9 ceiling, spread over the floor so no cell is dark
  for (const [x, z] of [[25, 19], [28, 19], [25, 22], [28, 23]]) {
    g.set(x, 8, z, ...B.lantern(true));
  }
}
