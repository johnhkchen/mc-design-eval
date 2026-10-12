// Room: Bathroom (interior designer). Inner air box [1,10,17,8,12,22]; doorway (9,10..11,19) from the landing (east).
// Layout: clawfoot tub (four cauldrons in a row) against the west party wall, a bath mat under it; a spruce washstand
// with a lantern on the north wall; a quartz pedestal basin in the NE corner; a linen barrel in the SE corner; lanterns
// hung from the ceiling over the tub and the room, so the floor is lit everywhere and the tub is the brightest spot.
// Everything stays in the box; nothing sits over the doorway (x9) and no path cell is blocked.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TUB = "cauldron";                         // clawfoot tub: four cauldrons in a row along the west wall
const MAT = "white_carpet";                     // bath mat beside the tub
const WASH = "spruce";                          // washstand: spruce fence legs + spruce slab top
const PEDESTAL = "smooth_quartz";               // pedestal sink column
const BASIN = "cauldron";                       // the basin (cauldron) on the pedestal
const LINEN = "barrel";                         // linen cabinet

export function build(g) {
  // clawfoot tub: x1, z18..21 (against the west party wall, floor y10)
  for (const z of [18, 19, 20, 21]) g.set(1, 10, z, TUB);

  // bath mat in front of the tub, on the floor (carpet is walkable)
  g.set(3, 10, 19, MAT);
  g.set(3, 10, 20, MAT);

  // washstand on the north partition: spruce fence leg, spruce slab top, lantern standing on top
  g.set(3, 10, 17, ...B.fence(WASH));
  g.set(3, 11, 17, ...B.slab(WASH, "bottom"));
  g.set(3, 12, 17, ...B.lantern(false));

  // pedestal sink in the NE corner: quartz column with a cauldron basin on top
  g.set(7, 10, 17, PEDESTAL);
  g.set(7, 11, 17, BASIN);

  // linen barrel in the SE corner
  g.set(8, 10, 22, LINEN, { facing: "up", open: "false" });

  // hanging lanterns from the ceiling (slab at y13): over the tub, over the middle, and by the sink/linen
  g.set(2, 12, 19, ...B.lantern(true));
  g.set(2, 12, 21, ...B.lantern(true));
  g.set(5, 12, 19, ...B.lantern(true));
  g.set(7, 12, 21, ...B.lantern(true));
}
