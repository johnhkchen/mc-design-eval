// Part: room: Boarding west bunk room (interior, box x50..53 z10..12 y8..11, door x51 z13 from the landing).
// Four brown bunk beds along the north wall: heads against z9, feet to the lane at z11, the lane z12 clear from the
// door across to every foot. The lane is the only walk, so nothing else stands on the floor. Light from the hanging lantern.
import { bed_set } from "../vocab.mjs";

export function build(g) {
  // Beds: foot at z11, head at z10 against the north wall (facing north), brown bed (boarding house colour).
  for (const x of [50, 51, 52, 53]) bed_set(g, [x, 8, 11], "north", "brown");

  // Lantern over the lane, hung on an iron chain from the ceiling (y 12) above the door's line.
  g.set(51, 11, 12, "iron_chain", { axis: "y" });
  g.set(51, 10, 12, "lantern", { hanging: "true" });
}
