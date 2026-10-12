// Room 8: Three-car garage, interior designer. Inner air x1..17, y1..5, z6..21 (floor y0 polished andesite from the shell).
// Front (z6..12): three open car bays in front of the carriage doors, kept clear. Back (z13..21): work zone grouped by use:
// a cabinet run on the west wall, a workbench (focal, under a hanging lantern) with a tool wall above it on the back wall,
// a cabinet and tool wall at the back-left, a water heater in the back-right corner and a bike rail on the east side.
// The mudroom step (17,1,17..18) rises east to the door at x18 y2..3. Light: hanging lanterns from the y6 ceiling.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPRUCE_PLANKS = "spruce_planks";
const SPRUCE_SLAB = "spruce_slab";
const IRON_BARS = "iron_bars";
const WHITE_CONCRETE = "white_concrete";
const SMOOTH_STONE_SLAB = "smooth_stone_slab";

// Iron bars as a pegboard on a wall: connects to the wall behind (south) and to its neighbours (east/west).
const bars = (north = false, south = true, east = true, west = true) =>
  [IRON_BARS, { north: String(north), south: String(south), east: String(east), west: String(west), waterlogged: "false" }];

export function build(g) {
  // Mudroom step: two stairs at x17 y1 rising east onto the door sill (x18 y2).
  for (const z of [17, 18]) g.set(17, 1, z, ...B.stairs("spruce", "east", "bottom"));

  // West cabinet run: planks cabinets at y1 with a slab shelf above on x1, z13..17.
  for (let z = 13; z <= 17; z++) {
    g.set(1, 1, z, SPRUCE_PLANKS);
    g.set(1, 2, z, ...B.slab("spruce", "bottom"));
  }

  // Back-left: cabinet under a tool wall at x2..5 z21.
  g.fill([2, 1, 21], [5, 1, 21], SPRUCE_PLANKS);
  for (let x = 2; x <= 5; x++) for (const y of [2, 3, 4]) g.set(x, y, 21, ...bars());

  // Focal workbench: planks counter at y1 with a slab top at y2, x7..11 z21, tool wall above it at y3..4.
  g.fill([7, 1, 21], [11, 1, 21], SPRUCE_PLANKS);
  for (let x = 7; x <= 11; x++) g.set(x, 2, 21, ...B.slab("spruce", "bottom"));
  for (let x = 7; x <= 11; x++) for (const y of [3, 4]) if (!(x === 9 && y === 3)) g.set(x, y, 21, ...bars());
  g.set(9, 3, 21, ...B.lantern(false));   // bench lamp: stands on the slab top, in place of the centre bar

  // Back-right: water heater (white tank, smooth slab cap) at x17 z21.
  g.set(17, 1, 21, WHITE_CONCRETE);
  g.set(17, 2, 21, WHITE_CONCRETE);
  g.set(17, 3, 21, SMOOTH_STONE_SLAB, { type: "bottom", waterlogged: "false" });

  // East bike rail at x15 z13..16: iron bars running north-south on y1 and y2 posts.
  for (let z = 13; z <= 16; z++) g.set(15, 1, z, ...bars(z > 13, z < 16, false, false));

  // Hanging lanterns from the y6 ceiling: one over each car bay, one over the workbench, two over the work zone.
  for (const [x, z] of [[3, 9], [8, 9], [13, 9], [3, 13], [8, 13], [13, 13], [6, 17], [11, 17], [3, 20], [9, 20], [14, 20]]) {
    g.set(x, 5, z, ...B.lantern(true));
  }
}
