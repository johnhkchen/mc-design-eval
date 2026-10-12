// room: Foyer (double height): furnishes the east half (x23..25) of the foyer box [20,2,9,25,8,13].
// The stair, bullnose, banister and chandelier (x20..24, z9..13, above y2) belong to the stair part and are never touched.
// Layout: a 2-wide runner lane on x23..24 (the walk from the entry to the cased dining opening and the hall), a console
// table with a glass mirror and a lantern on the east partition (x25, z11..13), a potted fern at the corner.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DARK_OAK_PLANKS, DARK_OAK_SLAB, GLASS_PANE, LANTERN, RED_CARPET, POTTED_FERN } from "../vocab.mjs";

// place only into air: the earlier parts' blocks are locked
function put(g, x, y, z, pair) {
  if (g.isAir(x, y, z)) g.set(x, y, z, ...pair);
}

export function build(g) {
  // runner carpet, x23..24 z10..12 (walkable floor layer, y2)
  for (let z = 10; z <= 12; z++)
    for (const x of [23, 24]) put(g, x, 2, z, [RED_CARPET, {}]);
  // lantern on the floor at the south-west corner of the lane, potted fern beside it
  put(g, 23, 2, 13, [LANTERN, { hanging: "false", waterlogged: "false" }]);
  put(g, 24, 2, 13, [POTTED_FERN, {}]);
  // floor lantern in the north-east corner, off the lane to the dining opening (x25, z10..12 stay clear)
  put(g, 25, 2, 9, [LANTERN, { hanging: "false", waterlogged: "false" }]);

  // console table on the east partition: planks base at y2, bottom slab top at y3, z11..13
  for (let z = 11; z <= 13; z++) {
    put(g, 25, 2, z, B.block(DARK_OAK_PLANKS));
    put(g, 25, 3, z, [DARK_OAK_SLAB, { type: "bottom", waterlogged: "false" }]);
  }
  // lantern stands on the table at the south end of the table
  put(g, 25, 4, 11, [LANTERN, { hanging: "false", waterlogged: "false" }]);
  // mirror: two glass panes standing on the table, pane plane along z (faces west into the room)
  for (const z of [12, 13]) put(g, 25, 4, z, [GLASS_PANE, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }]);
}
