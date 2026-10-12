// Room 10: Bedroom 3, interior designer. Inner air x19..25, y7..9, z8..12 (floor oak y6, ceiling y10 smooth_quartz).
// Front window xc=22 on the north wall z7 (y7..9); interior door (22, y7..8, z13) from the upper hall.
// Layout: bed headboard against the west wall (focal), desk + chair under the window, dresser on the east wall.
// Light: hanging lantern from the ceiling, lanterns on the desk and the nightstand.
// NOTE: the palette has no bed, carpet, barrel or flower pot; the bed is a palette stand-in (see plan.md Notes).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SPRUCE_PLANKS, WHITE_CONCRETE, SMOOTH_QUARTZ } from "../vocab.mjs";

export function build(g) {
  // Door: spruce door in the south wall z13, x22, y7..8 (hinge left, facing south)
  for (const [y, half] of [[7, "lower"], [8, "upper"]]) g.set(22, y, 13, ...B.door("spruce", "south", half, "left"));

  // Bed (west wall): headboard spruce planks at x19 z9..10 y7..8, mattress white concrete x20..21 z9..10 y7 and a
  // smooth quartz pillow on the head end at y8
  for (const z of [9, 10]) {
    g.set(19, 7, z, SPRUCE_PLANKS);
    g.set(19, 8, z, SPRUCE_PLANKS);
    for (const x of [20, 21]) g.set(x, 7, z, WHITE_CONCRETE);
  }
  g.set(20, 8, 9, SMOOTH_QUARTZ);
  g.set(20, 8, 10, SMOOTH_QUARTZ);

  // Nightstand (west wall, z11): spruce slab top half, lantern on it
  g.set(19, 7, 11, ...B.slab("spruce", "top"));
  g.set(19, 8, 11, ...B.lantern(false));

  // Desk under the window (z8, x21..23): spruce slab top half as the tabletop, lantern as the desk light
  for (let x = 21; x <= 23; x++) g.set(x, 7, 8, ...B.slab("spruce", "top"));
  g.set(22, 8, 8, ...B.lantern(false));

  // Desk chair: spruce stairs at (22,7,9), back toward the south (facing south)
  g.set(22, 7, 9, ...B.stairs("spruce", "south", "bottom"));

  // Dresser on the east wall (x25, z9..11): spruce planks base, spruce slab top, lantern on top
  for (let z = 9; z <= 11; z++) {
    g.set(25, 7, z, SPRUCE_PLANKS);
    g.set(25, 8, z, ...B.slab("spruce", "top"));
  }
  g.set(25, 9, 10, ...B.lantern(false));

  // Ceiling lights, hanging from the y10 ceiling: centre, and the dark bed-corner at the headboard
  g.set(22, 9, 10, ...B.lantern(true));
  g.set(19, 9, 8, ...B.lantern(true));
}
