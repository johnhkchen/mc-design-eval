// room: Dining room (plan.md ROOMS, box [2,5,17,8,7,23]). Formal dining: a long dark-oak table with chairs, a sideboard
// on the north wall, the west fireplace's firebox, a green rug and a lantern chandelier over the table (green and gold).
// Writes only into the room's air (x2..8, y5..7, z17..23) and the reserved firebox cells (1,5..6,20..22).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, GREEN_CARPET } from "../vocab.mjs";

// Table: dark_oak_fence legs along x6 z18..22 with a dark_oak_slab (bottom) top at y6, so the top reads as a table.
// Chairs: dark_oak_stairs seats on both sides (x5 faces east, x7 faces west), no trapdoor backs, so the x4 and x8 lanes stay clear.
// Sideboard: barrels at x6..8 z17 with a dark_oak_slab (bottom) top, lanterns on it.
export function build(g) {
  // Firebox (1,5..6,20..22) is NOT filled here: the shell leaves it as locked air, so netherrack and fire would be refused.
  // See plan.md Notes (dining firebox).
  // A standing lantern in the throat (2,6,21) lights the hearth pocket the surround closes off (it was dark).
  g.set(2, 6, 21, ...B.lantern(false));

  // Green rug at the north-west corner, walkable.
  g.fill([2, 5, 17], [3, 5, 18], GREEN_CARPET);

  // Table and chairs.
  for (let z = 18; z <= 22; z++) {
    g.set(6, 5, z, "dark_oak_fence", { north: "false", south: "false", east: "false", west: "false" });
    g.set(6, 6, z, ...B.slab("dark_oak", "bottom"));
    g.set(5, 5, z, ...B.stairs("dark_oak", "east", "bottom"));
    g.set(7, 5, z, ...B.stairs("dark_oak", "west", "bottom"));
  }

  // Sideboard on the north wall, east of the north doorway.
  for (let x = 6; x <= 8; x++) {
    g.set(x, 5, 17, BARREL, { facing: "up", open: "false" });
    g.set(x, 6, 17, ...B.slab("dark_oak", "bottom"));
  }
  g.set(6, 7, 17, ...B.lantern(false));
  g.set(8, 7, 17, ...B.lantern(false));

  // Chandelier: iron chains hang from the ceiling (y8) with lanterns beneath them over the chairs; a central lantern hangs off the ceiling over the table.
  for (const [x, z] of [[5, 19], [7, 19], [5, 21], [7, 21]]) {
    g.set(x, 7, z, ...B.chain("y"));
    g.set(x, 6, z, ...B.lantern(true));
  }
  g.set(6, 7, 20, ...B.lantern(true));
}
