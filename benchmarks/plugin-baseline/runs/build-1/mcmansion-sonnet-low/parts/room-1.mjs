// Room 1: Foyer, interior designer. Inner air x27..34, y2..9, z8..13 (entered by the double door at z7, arch east at
// x35 z11..12, door west at x26 z11, open south to the under-gallery hall). Stair (shell) runs up the west wall at
// x27..28 z8..12. Furniture: a console table on the north wall east of the door, a flat rug and the focal chandelier
// centred on x30..31 z10..11, two standing lanterns for the corners. Only palette blocks; no carpet or flower pots.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SPRUCE_FENCE } from "../vocab.mjs";

export function build(g) {
  // Chandelier: a 2x2 cluster of iron chains under the y10 ceiling, each carrying a hanging lantern at y8.
  for (const x of [30, 31]) for (const z of [10, 11]) {
    g.set(x, 9, z, ...B.chain("y"));
    g.set(x, 8, z, ...B.lantern(true));
  }

  // Rug: smooth stone slabs (bottom half) on the floor, centred under the chandelier.
  for (let x = 29; x <= 32; x++) for (let z = 9; z <= 12; z++) g.set(x, 2, z, ...B.slab("smooth_stone", "bottom"));

  // Console table on the north wall, east of the door: spruce fence legs at y2, spruce slab top at y3, lantern on top.
  for (const x of [33, 34]) {
    g.set(x, 2, 8, SPRUCE_FENCE);
    g.set(x, 3, 8, ...B.slab("spruce", "top"));
  }
  g.set(33, 4, 8, ...B.lantern(false));

  // Corner floor lanterns: south-west by the stair foot, and south-east beside the hall opening.
  g.set(27, 2, 13, ...B.lantern(false));
  g.set(34, 2, 13, ...B.lantern(false));
}
