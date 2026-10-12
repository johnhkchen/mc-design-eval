// room: Back bedroom (plan.md ROOMS: inner air [2,9,25,8,11,31], spruce_planks floor at y8).
// Guest bedroom at the back: a bed against the west wall as the focal piece, a barrel nightstand with a lantern,
// a wardrobe on the north partition, and a reading chair with a small table by the back windows (x3..4, x7..8 at z32).
// Entered from the study through the doorway at (4,9..10,24). Everything stays inside the room box.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed, nightstand, wardrobe, table, chair, rug } from "../vocab.mjs";

export function build(g) {
  // Focal piece: a blue bed (the palette's nearest cool colour to purple) with its head against the west wall x2.
  bed(g, 3, 9, 28, "blue", "west");

  // Bedside: a barrel nightstand with a standing lantern on its lid, and a hanging lantern over the bed head.
  nightstand(g, 2, 9, 27);
  g.set(2, 10, 27, ...B.lantern(false));
  g.set(2, 11, 28, ...B.lantern(true));

  // Wardrobe on the north partition, beside the study doorway (x4) and clear of its approach.
  wardrobe(g, 6, 9, 25, "south");

  // Quiet purple rug between bed and window, lit by a hanging lantern.
  rug(g, 4, 6, 9, 27, 29, "purple");
  g.set(6, 11, 27, ...B.lantern(true));

  // Reading chair by the back windows: a small table at x6 z30 and the chair at x7 z30 facing the window (south).
  table(g, 6, 9, 30);
  chair(g, 7, 9, 30, "south");
  g.set(6, 11, 31, ...B.lantern(true));
}
