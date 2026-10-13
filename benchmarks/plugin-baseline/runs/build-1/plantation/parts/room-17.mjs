// Part: room: bedroom 3 (West front bedroom: bed, wardrobe of barrels, chair).
// Inner air x37..43 x z43..49, floor y11, air y11..16. Focal piece: the white bed on the west wall, head to the wall,
// seen from the south door. Wardrobe of four barrels in the north-west corner; a dark-oak writing table under the
// front window with a chair; a nightstand lantern by the bed; a red rug; a hanging lantern from a chain.
// Doorways: south z50 x40..41 (corridor), east x44 z46..47 (upper hall). Their first cells (z49 x40..41, x43 z46..47) stay clear.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR = 11;

export function build(g) {
  // the bed: foot at x38, head at x37 (against the west wall), pillow end toward west
  bed(g, [38, FLOOR, 44], "west", "white");

  // floor level y11, rows z43..49, columns x37..43; '.' is left alone (bed cells, open lanes)
  layers(g, [37, FLOOR, 43], {
    "B": "barrel",
    "f": "dark_oak_fence",
    "c": ["dark_oak_stairs", { facing: "north", half: "bottom" }],
    "r": "red_carpet",
    "L": ["lantern", { hanging: "false" }],
  }, [
    "BB..f..", // z43: wardrobe barrels x37..38; writing table x41 under the window
    "....c..", // z44: chair facing the table (bed foot at x38, head x37)
    "f...L..", // z45: nightstand post by the bed head; standing lantern on the floor lights the desk corner
    ".rrrr..", // z46..48: red rug between the bed and the doorways
    ".rrrr..",
    ".rrrr..",
    ".......", // z49: clear first cell of the south door
  ]);

  // barrels stacked into the wardrobe, table and nightstand tops (top slabs), y12
  layers(g, [37, FLOOR + 1, 43], {
    "B": "barrel",
    "s": ["dark_oak_slab", { type: "top" }],
  }, [
    "BB..s..",
    ".......",
    "s......",
    ".......",
    ".......",
    ".......",
    ".......",
  ]);

  // lights at table height: a candle on the writing table, a lantern on the nightstand (y13)
  layers(g, [37, FLOOR + 2, 43], {
    "k": ["candle", { candles: "1", lit: "true" }],
    "L": ["lantern", { hanging: "false" }],
  }, [
    "....k..",
    ".......",
    "L......",
    ".......",
    ".......",
    ".......",
    ".......",
  ]);

  // ceiling light: iron chain under the ceiling (y16) and a hanging lantern (y15) over the rug
  layers(g, [37, FLOOR + 4, 43], {
    "l": ["lantern", { hanging: "true" }],
  }, [
    ".......",
    ".......",
    ".......",
    "...l...", // z46 x40 at y15 (the layer below is the chain row)
    ".......",
    ".......",
    ".......",
  ]);
  layers(g, [37, FLOOR + 5, 43], {
    "i": ["iron_chain", { axis: "y" }],
  }, [
    ".......",
    ".......",
    ".......",
    "...i...",
    ".......",
    ".......",
    ".......",
  ]);
}
