// P4 wing kitchen: inner air x50..52, y3..6, z13..15. Door (51,3..4,12) from the porch on the north; the hearth mouth
// (51,3,16) and its fire sit in the back wall. Focal piece: the stove beside the hearth, its front looking into the
// room. The table runs along the south side with one chair on its north, a barrel dresser in the NW corner, and a
// lantern standing on the table. The door's first cell (51,3,13) and the stove's front (52,3,14) stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chair, stove } from "../vocab.mjs";

export function build(g) {
  // NW corner dresser: a barrel with a flower pot on it (rows run along +z from z13; columns along +x from x50)
  layers(g, [50, 3, 13], { b: "barrel", p: "flower_pot" }, [
    ["b..", "...", "..."],   // y3: barrel in the corner
    ["p..", "...", "..."],   // y4: pot on the barrel top
  ]);

  // worktable on the south side, one cell at x50 (x51 is the hearth step, already built by an earlier part): spruce
  // fence leg at y3, top slab (type top) at y4 so the table's face is y5 (table_set would lay bottom slabs, and a
  // lantern on those floats)
  layers(g, [50, 3, 15], { f: "spruce_fence", t: ["spruce_slab", { type: "top" }] }, [
    ["f"],   // y3: leg
    ["t"],   // y4: top
  ]);
  // one chair on the table's north side, sitter facing south
  chair(g, 50, 3, 14, "south");
  // the stove by the hearth mouth (back wall, its front toward the room); the flue plate is laid on top by stove()
  stove(g, 52, 3, 15, "north");

  // a lantern standing on the worktable (the top slab's face at y5) lights the room's west half; the stove and the
  // hearth fire give the east half. hanging_lantern needs a ceiling and none is built yet, so it is not used here.
  g.set(50, 5, 15, ...B.lantern(false));
}
