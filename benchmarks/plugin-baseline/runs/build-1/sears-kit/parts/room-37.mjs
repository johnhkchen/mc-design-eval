// Room "P4 north-east bedroom" (interior designer's part): inner air x73..76, y6..8, z14..17. The bed's head sits against
// the solid east wall (x77) at z16: the windows on that wall are at z14..15, so z16 is clear of them. The door is on the
// west side, so x73 stays a clear lane from the door to the bed. The focal piece is the bed; a barrel dresser runs along
// the north wall with a pot, a bedside lantern stands on a fence post by the bed's head, a hanging lantern lights the
// middle, and a red rug lies at the foot.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot at (75,6,16), head one step east at (76,6,16), against the solid east wall
  bed(g, [75, 6, 16], "east", "red");

  // floor layer y6 (x73..76 by z14..17): dresser barrels and a bedside post, a rug at the foot
  // y7 layer: the pot on the dresser, a standing lantern on the bedside post
  // y8 layer: a hanging lantern under the ceiling beam, centre of the room
  g.set(74, 9, 15, "spruce_planks");   // the ceiling beam over the hanging lantern (y8, z15)
  layers(g, [73, 6, 14], {
    "b": "barrel",
    "f": "oak_fence",
    "r": "red_carpet",
    "p": "potted_poppy",
    "L": ["lantern", { hanging: "false" }],
    "H": ["lantern", { hanging: "true" }],
  }, [
    [
      ".bbf",   // z14: barrels under the north window, post by the head
      "....",   // z15: the door lane
      "....",   // z16: bed (placed by bed())
      ".rr.",   // z17: rug at the foot
    ],
    [
      ".p.L",   // z14: pot on the barrel, lantern on the post
      "....",
      "....",
      "....",
    ],
    [
      "....",
      ".H..",   // z15: hanging lantern in the centre
      "....",
      "....",
    ],
  ]);
}
