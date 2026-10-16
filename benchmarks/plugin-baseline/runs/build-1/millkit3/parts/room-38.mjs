// P7 west parlour (box x86..88, y3..6, z10..12). A 3 x 3 sitting room with the unit's one bed, a small table and
// the stair column. Ways in: front door (88,3,10) and kitchen door (86,3,13). The lane is kept clear:
// (88,10) -> (88,11) -> (87,11) -> (87,12) -> (86,12) -> door. The stair column x88 z12 is left alone.
import { bed, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // bed: foot (87,3,10), head (86,3,10) against the solid west wall x85 (windows sit at z11 and z14 only)
  const placed = bed(g, [87, 3, 10], "west", "red");
  if (!placed) throw new Error("P7 west parlour: bed refused");

  // table beside the bed, against the west wall: spruce fence post and top slab at y4 (its top face at y5)
  g.set(86, 3, 11, ...B.fence("spruce"));
  g.set(86, 4, 11, ...B.slab("spruce", "top"));
  // standing lantern on the table: the light for the room's west half
  g.set(86, 5, 11, ...B.lantern(false));

  // hanging lantern from the upper floor block above (87,7,11), over the lane, lighting the middle and the stair foot
  g.set(87, 6, 11, ...B.lantern(true));
}
