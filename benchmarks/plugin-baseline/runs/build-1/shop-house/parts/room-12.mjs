// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Child's room B. Small rear bedroom, inner air x 15..18, y 19..22, z 15..21 (rooms.json). Door x16 z14 on the
// north wall; the rear ladder (x16 z21) and the loft hatch above x16 z20 stay clear. Layout, one focal piece:
//   bed head-to-wall on the west wall (red_bed, the focal piece); desk and chair on the east side under the windows;
//   a bookshelf with a candle and a flower pot on the north-east; a barrel toy box in the south-west corner; a red rug.
// Light: two hanging lanterns under the loft floor, and a lit candle on the shelf.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // floor row y19: bed (h head x15, f foot x16, facing west), bookshelf b, rug r, barrel B, chair R (back west), desk F
  layers(g, [15, 19, 15], {
    "h": ["red_bed", { facing: "west", part: "head" }],
    "f": ["red_bed", { facing: "west", part: "foot" }],
    "b": "bookshelf",
    "r": "red_carpet",
    "B": "barrel",
    "R": ["spruce_stairs", { facing: "west", half: "bottom" }],
    "F": "oak_fence",
  }, [
    ["...b",   // z15
     "...b",   // z16
     "hf..",   // z17
     ".rr.",   // z18
     ".rr.",   // z19
     "B.RF",   // z20
     "...."],  // z21 (ladder column x16 stays air)
  ]);

  // second row y20: candle and flower pot on the shelf, slab top of the desk
  layers(g, [15, 20, 15], {
    "c": ["candle", { candles: "2", lit: "true" }],
    "p": "flower_pot",
    "S": "oak_slab",
  }, [
    ["...c",   // z15
     "...p",   // z16
     "....",   // z17
     "....",   // z18
     "....",   // z19
     "...S",   // z20
     "...."],  // z21
  ]);

  // ceiling row y22: two lanterns hanging from the loft floor (y23)
  layers(g, [15, 22, 15], {
    "L": ["lantern", { hanging: "true" }],
  }, [
    ["....",   // z15
     ".L..",   // z16: lantern over the bed's foot side
     "....",   // z17
     "....",   // z18
     "..L.",   // z19: lantern over the rug and desk
     "....",   // z20 (hatch column x16 stays clear)
     "...."],  // z21
  ]);
}
