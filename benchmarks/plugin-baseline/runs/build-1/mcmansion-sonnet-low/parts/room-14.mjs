// Room 14: Walk-in closet, interior designer. Inner air x36..42, y7..9, z17..22; door (39,y7..8,z16) on the north wall.
// Layout: birch island dresser (focal) centred under a hanging lantern; iron-bar rails hang from the east and west
// walls over shelf stacks; stair seats at the island; a spruce vanity on the south wall; lanterns for light.
// Aisles stay open: x37 and x41 run the full depth, z18 and z21 cross the room, and the door cell (39,17) is free.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BIRCH_PLANKS = "birch_planks";
const SPRUCE_PLANKS = "spruce_planks";
const IRON_BARS = "iron_bars";

export function build(g) {
  // island dresser (focal): birch base at y7 with a slab counter on top at y8, x38..40 z19..20
  g.fill([38, 7, 19], [40, 7, 20], BIRCH_PLANKS);
  for (let x = 38; x <= 40; x++) for (let z = 19; z <= 20; z++) g.set(x, 8, z, ...B.slab("birch", "bottom"));

  // vanity on the south wall: spruce base with a counter, x39..40 z22 (x38 stays open: it is the cell in front of the
  // bath door at z23, so the closet can reach the bath)
  g.fill([39, 7, 22], [40, 7, 22], SPRUCE_PLANKS);
  for (let x = 39; x <= 40; x++) g.set(x, 8, 22, ...B.slab("spruce", "bottom"));

  // shelf stacks along the west and east walls, z18..21
  for (let z = 18; z <= 21; z++) {
    g.set(36, 7, z, BIRCH_PLANKS);
    g.set(36, 8, z, ...B.slab("birch", "bottom"));
    g.set(42, 7, z, SPRUCE_PLANKS);
    g.set(42, 8, z, ...B.slab("spruce", "bottom"));
  }

  // hanging rails: iron bars at y9 along each wall above the shelves
  for (let z = 18; z <= 21; z++) {
    g.set(36, 9, z, IRON_BARS, { north: "true", south: "true", east: "false", west: "true", waterlogged: "false" });
    g.set(42, 9, z, IRON_BARS, { north: "true", south: "true", east: "true", west: "false", waterlogged: "false" });
  }

  // north corners: a plank post with a standing lantern on each, flanking the door
  for (const x of [36, 42]) {
    g.set(x, 7, 17, SPRUCE_PLANKS);
    g.set(x, 8, 17, ...B.lantern(false));
  }

  // seats: spruce stairs with the tall back away from the island (north chair faces south, south chair faces north)
  g.set(40, 7, 18, ...B.stairs("spruce", "north", "bottom"));
  g.set(39, 7, 21, ...B.stairs("spruce", "south", "bottom"));

  // light: hanging lanterns over the island and the two south corners
  g.set(39, 9, 19, ...B.lantern(true));
  g.set(36, 9, 22, ...B.lantern(true));
  g.set(42, 9, 22, ...B.lantern(true));
}
