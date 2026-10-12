// villa-haiku: room 9, cubiculum W-S (plan.md ROOMS): a bedchamber for two. Inner air x1..8, y2..5, z15..20.
// Door (9, 2..3, 17) from the atrium on the east; window (0, 3..4, 17..18) on the west. Nothing over either.
// Layout: the two red beds lie head-to-the-side-wall at the north end (z15), a barrel between them; a red rug
// in the middle of the floor; the lamp and two pots at the south end. The path from the door runs along z=16..17.
import { BARREL, BED, CUSHION, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // beds: head at the side wall (x1 west, x8 east), foot toward the middle. facing = head -> foot.
  g.set(1, 2, 15, BED, { facing: "east", part: "head", occupied: "false" });
  g.set(2, 2, 15, BED, { facing: "east", part: "foot", occupied: "false" });
  g.set(8, 2, 15, BED, { facing: "west", part: "head", occupied: "false" });
  g.set(7, 2, 15, BED, { facing: "west", part: "foot", occupied: "false" });

  // the chest between the beds
  g.set(4, 2, 15, BARREL, { facing: "up", open: "false" });

  // a rug on the floor between the beds and the door
  g.fill([4, 2, 17], [5, 2, 18], CUSHION);

  // one lamp (the room's light) and two pots at the south end, off the path
  lamp(g, 4, 20);
  pot(g, 1, 20, "fern");
  pot(g, 8, 20, "azalea");

  return g;
}
