// Room 9: Upper hall and gallery, interior designer. Inner air x19..34, y7..9, z14..15 (two cells deep).
// The walkway runs along z15 (stair arrival and both arches, plus the approach cells of the three bedroom doors, stay
// clear). The north row z14 holds a reading nook (west), a lit pedestal as the focal piece (centre), a side table by
// the stair arrival, and an iron-bar rail over the foyer void (x29..34). Lanterns hang from the y10 ceiling over the walkway.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SMOOTH_QUARTZ, QUARTZ_PILLAR, IRON_BARS } from "../vocab.mjs";

export function build(g) {
  // West reading nook against the north wall: a two-seat bench (stairs, backs north) and a table lit from above.
  g.set(19, 7, 14, ...B.fence("spruce"));
  g.set(19, 8, 14, ...B.slab("spruce", "bottom"));
  g.set(19, 9, 14, ...B.lantern(false));
  for (const x of [20, 21]) g.set(x, 7, 14, ...B.stairs("spruce", "north", "bottom"));

  // Focal piece: a lit pedestal at the centre of the north row, in view from the stair arrival.
  g.set(24, 7, 14, SMOOTH_QUARTZ);
  g.set(24, 8, 14, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(24, 9, 14, ...B.lantern(false));

  // Side table by the stair arrival (x27..28 stay clear).
  g.set(26, 7, 14, ...B.fence("spruce"));
  g.set(26, 8, 14, ...B.slab("spruce", "bottom"));

  // Iron-bar rail along the foyer void (z14, x29..34), open toward the arch at the east end.
  for (let x = 29; x <= 34; x++) {
    g.set(x, 7, 14, IRON_BARS, {
      north: "false", south: "false",
      east: x < 34 ? "true" : "false", west: x > 29 ? "true" : "false", waterlogged: "false",
    });
  }

  // Hanging lanterns from the y10 ceiling, over the walkway (y9 keeps the 2-high path clear).
  for (const x of [21, 27, 33]) g.set(x, 9, 15, ...B.lantern(true));
}
