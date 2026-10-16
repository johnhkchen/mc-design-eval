// P2 living room: the Foursquare's front parlour, box [28,3,10, 30,6,12], floor y3, stand y3.
// Focal piece: the lit stove on the west wall beside the hearth (27,3,12), set in the room at (28,3,11) with its front
// to the east. One chair (28,3,10) faces it from the north side. A side table in the south-east corner (30,12) carries
// a standing lantern. The middle lane (29,10..12) and the doorway cells (30,10), (30,11), (29,12) stay clear.
// Light: the lit furnace, the table lantern, and a hanging lantern from the ceiling block y7.
import { stove, chair, hanging_lantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the stove, against the hearth wall; its iron flue plate sits on top
  stove(g, 28, 3, 11, "east", { kind: "furnace" });

  // the sitter's chair, looking south at the stove (stair's back to the north wall)
  chair(g, 28, 3, 10, "south");
  chair(g, 29, 3, 10, "south");

  // side table in the south-east corner: spruce fence leg, top slab, standing lantern on it
  g.set(30, 3, 12, ...B.fence("spruce"));
  g.set(30, 4, 12, ...B.slab("spruce", "top"));
  g.set(30, 5, 12, ...B.lantern(false));

  // hanging lantern from the ceiling block over the middle lane
  hanging_lantern(g, 29, 6, 11);
}
