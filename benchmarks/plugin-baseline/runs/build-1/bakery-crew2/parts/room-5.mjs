// Room 5, Schlafkammer (bedroom): the inner air box [9,7,15,15,10,21], floor y=7 (walk level), entered from the Stube
// through the doorway (11..12,7..8,14). Focal piece: the red bed, head to the back wall under the back window
// (12..13,8..9,22), its chest at the foot, a bedside barrel with a standing lantern. Shelf: bookshelf and chiseled
// bookshelf on the east wall, barrels with a poppy pot. Rug: brown carpet. Light: two hanging lanterns from the attic
// floor, plus the bedside lantern. Kept clear: the stair rail (9,7,14..17), the attic stair (x=10, z=15..18) and its
// foot (11,7,15), the doorway lane (11..12,7,15..16) and the bed's approach (11,7,20).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bedFrame } from "../vocab/h2.mjs";

export function build(g) {
  // Bed (head at z=21, foot z=20, chest z=19). Head to the back wall, facing south (foot to head).
  bedFrame(g, 12, 7, 21, "south");

  // Floor layer y=7, origin (9,7,15); rows z=15..21, columns x=9..15. '.' = left alone.
  // Bookshelf and barrels along the east wall; rug x=10..12 z=16..18; bedside barrel at (11,7,21).
  layers(g, [9, 7, 15], {
    r: "brown_carpet",
    k: ["barrel", { facing: "up" }],
    S: "bookshelf",
  }, [
    [
      "......k",
      "..rr...",
      "..rr...",
      "..rr..S",
      "...c..S",
      "...b..k",
      "..kB..k",
    ],
  ]);

  // Upper layers: the bedside lantern (y=8), the chiseled shelf and the flower pot (y=8), hanging lanterns (y=10).
  layers(g, [9, 8, 15], {
    C: ["chiseled_bookshelf", { facing: "west" }],
    P: "potted_poppy",
    L: ["lantern", { hanging: false }],
  }, [
    [
      "......P",
      ".......",
      ".......",
      "......C",
      "......C",
      ".......",
      "..L....",
    ],
  ]);

  layers(g, [9, 10, 15], {
    l: ["lantern", { hanging: true }],
  }, [
    [
      ".......",
      ".......",
      "..l....",
      ".......",
      ".....l.",
      ".......",
      ".......",
    ],
  ]);
}
