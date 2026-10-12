// Room 6: Formal dining room, interior designer. Inner air x36..42, y2..5, z8..15. Entered from the foyer arch
// (35, y2..4, z11..12); the turret bay alcove opens north at x38..40 z7; window east at (43, y3..5, z11..13).
// Layout: a long spruce-slab table on fence legs down the middle (x38..40, z10..14), eight stair chairs around it,
// the chandelier over the table as the focal piece, a sideboard on the south wall, a china cabinet on the east wall
// and a small round table with a lantern in the bay. The walk lanes are x36..37 (west) and x41..42 (east) and the
// z8..9 row, so the foyer arch and the bay both stay open.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SPRUCE_PLANKS, SPRUCE_FENCE, GLASS_PANE } from "../vocab.mjs";

const IRON_CHAIN = "iron_chain";

/** Stair chair at (x, z) on the floor (y2). Vocab convention: facing = the tall back side, so the seat faces the table. */
const chair = (g, x, z, back) => g.set(x, 2, z, ...B.stairs("spruce", back, "bottom"));

/** Standing lantern on a fence post at (x, z): the post at y2, the lantern at y3. */
const lamp = (g, x, z) => {
  g.set(x, 2, z, SPRUCE_FENCE);
  g.set(x, 3, z, ...B.lantern(false));
};

export function build(g) {
  // Long table: fence legs at x38 and x40, spruce slab tops at y3 across x38..40, z10..14.
  for (let z = 10; z <= 14; z++) {
    g.set(38, 2, z, SPRUCE_FENCE);
    g.set(40, 2, z, SPRUCE_FENCE);
    for (let x = 38; x <= 40; x++) g.set(x, 3, z, ...B.slab("spruce", "top"));
  }

  // Eight chairs: two per side, backs away from the table.
  chair(g, 38, 9, "north");
  chair(g, 40, 9, "north");
  chair(g, 38, 15, "south");
  chair(g, 40, 15, "south");
  chair(g, 37, 11, "west");
  chair(g, 37, 13, "west");
  chair(g, 41, 11, "east");
  chair(g, 41, 13, "east");

  // Focal piece: the chandelier hangs from the ceiling over the middle of the table.
  g.set(39, 5, 12, IRON_CHAIN);
  g.set(39, 4, 12, ...B.lantern(true));

  // Sideboard on the south wall: spruce planks with a slab shelf and a lantern.
  g.set(36, 2, 15, SPRUCE_PLANKS);
  g.set(37, 2, 15, SPRUCE_PLANKS);
  g.set(37, 3, 15, ...B.slab("spruce", "top"));
  g.set(36, 3, 15, ...B.lantern(false));

  // China cabinet on the east wall (x42, z8..9): planks base with glass panes above.
  for (const z of [8, 9]) {
    g.set(42, 2, z, SPRUCE_PLANKS);
    g.set(42, 3, z, GLASS_PANE);
    g.set(42, 4, z, GLASS_PANE);
  }

  // Bay alcove: a small round table at (39, z5) with a stair seat each side and a lantern on the table.
  g.set(39, 2, 5, SPRUCE_FENCE);
  g.set(39, 3, 5, ...B.slab("spruce", "top"));
  g.set(39, 4, 5, ...B.lantern(false));
  chair(g, 38, 5, "west");
  chair(g, 40, 5, "east");

  // Corner lamps for the room's ambient light.
  lamp(g, 36, 8);
  lamp(g, 42, 14);
}
