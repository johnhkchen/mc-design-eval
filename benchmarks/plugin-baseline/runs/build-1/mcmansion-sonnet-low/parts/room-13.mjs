// Room 13: Primary bedroom, interior designer. Inner air x36..42 z8..15 y7..9 (walk y7..8); arch in the west wall at
// z14..15 from the upper hall; the turret-bay alcove x38..40 z5..6 opens north-to-south through z7 at x38..40.
// Layout (all cells inside the room box or the alcove, nothing over the east window x43 z11..13 or the bay opening):
//   west wall x35: king bed, headboard on the wall at x36..37 z9..10, nightstands with lanterns at z8 and z11.
//   north wall z7: dresser (spruce chest run) at x40..42 z8 with a slab top.
//   east: open floor under the window, kept clear so the glass reads.
//   centre: pendant lantern on a chain over the walking space at x39 z11.
//   alcove: sitting pair: a slab table at x39 z5, a stair seat at x39 z6 facing the table, lantern on the table.
// Palette note: the palette has no bed, barrel, carpet or flower pot, so the bed is a spruce-plank platform with
// smooth-quartz pillows and mattress, and the dresser is spruce planks with a slab top. Both use palette ids only.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPRUCE_PLANKS = "spruce_planks";
const SMOOTH_QUARTZ = "smooth_quartz";

export function build(g) {
  // ---- king bed: headboard on the west wall (x36 = head, x37 = foot), 2 wide along z (z9..10) -----------------
  for (const x of [36, 37]) for (const z of [9, 10]) g.set(x, 7, z, SPRUCE_PLANKS);           // frame
  for (const z of [9, 10]) {
    g.set(36, 8, z, SMOOTH_QUARTZ);                                                          // pillows at the head
    g.set(37, 8, z, ...B.slab("smooth_quartz", "bottom"));                                   // mattress at the foot
  }

  // ---- nightstands flanking the headboard, each with a standing lantern ------------------------------------
  for (const z of [8, 11]) {
    g.set(36, 7, z, SPRUCE_PLANKS);
    g.set(36, 8, z, ...B.lantern(false));
  }

  // ---- dresser against the north wall: planks run x40..42 at z8 with a slab top -----------------------------
  for (const x of [40, 41, 42]) {
    g.set(x, 7, 8, SPRUCE_PLANKS);
    g.set(x, 8, 8, ...B.slab("spruce", "bottom"));
  }

  // ---- bench at the foot of the bed (x38 z9..10), a bottom slab on the floor
  for (const z of [9, 10]) g.set(38, 7, z, ...B.slab("spruce", "bottom"));

  // ---- centre pendant over the walking space: chain from the ceiling, hanging lantern below -----------------
  g.set(39, 9, 11, ...B.chain("y"));
  g.set(39, 8, 11, ...B.lantern(true));

  // ---- sitting area in the turret-bay alcove (x38..40 z5..6) ---------------------------------------------------
  g.set(39, 7, 5, ...B.slab("spruce", "bottom"));                    // table
  g.set(39, 8, 5, ...B.lantern(false));                              // table lamp on the slab
  g.set(39, 7, 6, ...B.stairs("spruce", "south", "bottom"));         // seat facing the table, back to the room
}
