// Room 4: Mudroom, interior designer. Inner air x19..25, y2..5, z14..19 (rooms.json box [19,2,14,25,5,19]).
// Ways in: garage door (18, y2..3, z17..18) on the west wall, hall door (26, y2..3, z15) and great-room door
// (26, y2..3, z18) on the east wall. The walk band z16..18 stays clear from the garage door to both east doors.
// Layout by use: north wall = drop zone (cabinet, locker row with a hook rail, bench with lantern above as the
// focal piece), NE corner = washing sink, south edge = shoe shelf. Floor is polished andesite where the shell left air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SPRUCE_PLANKS = "spruce_planks";
const SPRUCE_FENCE = "spruce_fence";
const SMOOTH_STONE = "smooth_stone";
const POLISHED_ANDESITE = "polished_andesite";
const IRON_BARS = "iron_bars";

export function build(g) {
  // Floor: hard-wearing polished andesite, only where the shell left air (earlier blocks are locked).
  for (let x = 19; x <= 25; x++) for (let z = 14; z <= 19; z++) {
    if (g.blockAt(x, 1, z) === "minecraft:air") g.set(x, 1, z, POLISHED_ANDESITE);
  }

  // Drop zone along the north wall (z14).
  g.fill([19, 2, 14], [23, 2, 14], SPRUCE_PLANKS);            // locker row, 1 high
  g.fill([19, 3, 14], [23, 3, 14], SPRUCE_FENCE);             // hook rail of fence pegs above the lockers
  g.fill([19, 2, 15], [19, 3, 15], SPRUCE_PLANKS);            // corner cabinet
  for (let x = 20; x <= 22; x++) {                            // bench: spruce stairs as seats, back to the south
    g.set(x, 2, 15, ...B.stairs("spruce", "south", "bottom"));
  }

  // Washing sink in the north-east corner: a stone basin with a tap.
  g.fill([24, 2, 14], [25, 2, 14], SMOOTH_STONE);
  g.set(25, 3, 14, IRON_BARS);

  // Shoe shelf along the south edge (z19), a slab shelf at bench height.
  g.fill([20, 2, 19], [23, 2, 19], ...B.slab("spruce", "bottom"));

  // Light: hanging lanterns from the y6 ceiling. The focal lantern hangs over the bench and lockers.
  g.set(21, 5, 15, ...B.lantern(true));
  g.set(24, 5, 17, ...B.lantern(true));
  g.set(20, 5, 19, ...B.lantern(true));
}
