// Part: room: Clerk's office (parts/room-5.mjs). The working office, box x5..9 z11..25 (floor y4), entered by the door at
// x10 z16 from the hall (the shell opens it there; plan.md says z20, the shell wins). The fireplace is on the west stack
// at x6 z17..18 (the chimney part builds the firebox); the chimney cells stay blank here.
//
// Layout: the clerk's desk is the focal piece (x7 z12..14), its chair facing the door. Filing bookshelves run along the
// north and east walls, barrels as drawers on the west wall, a red rug on the south floor, a lectern at the south end.
// Light: a lantern and a lit candle on the desk, a lantern on a barrel, a lantern on a post at the south-east corner.
// Lanes: the door cell x9 z16 and the x7..9 band stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  "B": "bookshelf", // filing shelves
  "f": ["dark_oak_fence", {}], // desk posts and the lamp post
  "S": ["dark_oak_slab", { type: "bottom" }], // desk top
  "h": ["dark_oak_stairs", { facing: "east", half: "bottom" }], // clerk's chair, back to the east, facing the desk
  "k": ["barrel", { facing: "up" }], // filing drawers
  "p": "flower_pot", // on the shelves
  "r": "red_carpet", // rug
  "l": ["lectern", { facing: "east", has_book: "true" }], // reading stand at the south end
  "L": ["lantern", { hanging: "false" }], // standing lanterns on a block
  "c": ["candle", { candles: "2", lit: "true" }], // desk candle
};

export function build(g) {
  const origin = [5, 4, 11];
  // Rows run along +x (x5..x9), successive rows along +z (z11..z25). ' ' = the chimney, left alone.
  // y4: floor-level furniture
  const floor = [
    "BBBBB", // z11 filing along the north wall
    "..fBB", // z12 desk post at x7; shelf at x8 and the east wall
    "...hB", // z13 chair at x8, facing the desk
    "..f..", // z14 desk post at x7
    ".....", // z15
    ".....", // z16 the door lane, kept clear
    "  ...", // z17 the fireplace front (chimney cells at x5..6)
    "  ...", // z18
    "k....", // z19 barrel drawers on the west wall
    "k....", // z20
    "k.rr.", // z21 barrel; the rug starts
    "..rr.", // z22
    "..rr.", // z23
    "..l.f", // z24 lectern at x7; lamp post at x9
    ".....", // z25
  ];
  // y5: the desk top, shelf pots, a lantern on the barrel and one on the post
  const top = [
    ".p.p.", // z11 pots on two shelves
    "..S..", // z12 desk top
    "..S.L", // z13 desk top; a lantern on the east shelf lights the fire end of the room
    "..S..", // z14 desk top
    ".....", // z15
    ".....", // z16
    ".....", // z17
    ".....", // z18
    ".....", // z19
    ".....", // z20
    "L....", // z21 lantern on the barrel
    ".....", // z22
    ".....", // z23
    "....L", // z24 lantern on the lamp post
    ".....", // z25
  ];
  // y6: things standing on the desk top
  const high = [
    ".....", // z11
    "..c..", // z12 candle
    "..L..", // z13 lantern
    ".....", // z14
    ".....", ".....", ".....", ".....", ".....", ".....", ".....", ".....", ".....", ".....", ".....", // z15..z25
  ];
  return layers(g, origin, legend, [floor, top, high]);
}
