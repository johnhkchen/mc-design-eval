// villa-haiku: room 12, cubiculum E-S (plan x27..34, z15..20; inner air y2..5). Bedchamber off the atrium.
// Door (26, 2..3, 17) in the west wall; window (35, 3..4, 17..18) in the east wall. Plan coordinates throughout.
// Layout: the bed lies along the north wall (headboard on the wall) with a bedside lamp at its head; the lectern and
// its stool sit under the east window for reading light. The way from the door runs along z17..18, clear to every piece.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BED, CUSHION, LECTERN, lamp } from "../vocab.mjs";

export function build(g) {
  // the bed: head at (33,15) against the north wall, foot at (33,16); facing is foot -> head, so north
  g.set(33, 2, 15, BED, { facing: "north", part: "head", occupied: "false" });
  g.set(33, 2, 16, BED, { facing: "north", part: "foot", occupied: "false" });

  // the bedside lamp: a standing lamp in the north-east corner, beside the head
  lamp(g, 34, 15);

  // the reading station: a lectern under the east window (book faces west, into the room), with a stool facing it
  g.set(34, 2, 18, LECTERN, { facing: "west", has_book: "true", powered: "false" });
  g.set(33, 2, 18, ...B.stairs("dark_oak", "east"));

  // a red rug beside the foot of the bed (carpet is walkable, so the path up to the bed stays clear)
  g.set(32, 2, 16, CUSHION);
  return g;
}
