// Room 7: Great room: kitchen and family room, interior designer. Inner air x27..42, y2..5, z17..27 (open plan).
// West half (x27..34) is the kitchen: counters along the west and back walls, fridge, stove under a stone hood, sink
// under the back window (z28, x29..31), island with stools. East half (x35..42) is the family room: TV on the north
// wall, sofa and coffee table facing it, and the stone fireplace breast on the east wall at z24..26 (chimney behind it
// is built by the details part; this part only adds the firebox, mantel and light).
// Entrances: arch (30..31,z16) from the hall, mudroom door (26,z18), pantry door (26,z24), slider (37..39,z28).
// Those doorways and the window/slider cells in front of them stay clear at y2..4 so every way in reaches the room.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const POLISHED = "polished_andesite";
const SMOOTH_STONE = "smooth_stone";
const SPRUCE = "spruce";
const STONE_BRICKS = "stone_bricks";
const CHISELED = "chiseled_stone_bricks";
const SMOOTH_QUARTZ = "smooth_quartz";

export function build(g) {
  // ---- kitchen (west x27..34) -------------------------------------------------------------------------------------
  // West counter run with a lamp on top; the mudroom and pantry walkways (z18, z23..25) stay open.
  g.fill([27, 2, 19], [27, 2, 22], POLISHED);
  g.set(27, 3, 20, ...B.lantern(false));

  // Back counter run under the back window: cooktop, hood, sink; fridge at the south-west corner.
  g.fill([27, 2, 27], [29, 2, 27], POLISHED);
  g.set(30, 2, 27, ...B.slab(SMOOTH_STONE, "top"));                // sink basin
  g.fill([31, 2, 27], [32, 2, 27], POLISHED);
  g.set(33, 2, 27, SMOOTH_STONE);                                    // stove top
  g.set(33, 4, 27, ...B.slab(SMOOTH_STONE, "bottom"));              // hood
  g.set(33, 5, 27, ...B.chain("y"));
  g.fill([27, 2, 26], [27, 3, 26], SMOOTH_QUARTZ);                  // fridge

  // Island (x30..31, z21..22) with stools north and south; a lamp on the island top.
  g.fill([30, 2, 21], [31, 2, 22], POLISHED);
  g.set(30, 3, 21, ...B.lantern(false));
  for (const x of [30, 31]) {
    g.set(x, 2, 20, ...B.stairs(SPRUCE, "north", "bottom"));        // stool, back to the north
    g.set(x, 2, 23, ...B.stairs(SPRUCE, "south", "bottom"));        // stool, back to the south
  }

  // ---- family room (east x35..42) ---------------------------------------------------------------------------------
  // TV on the north wall: a 3x2 screen at z17 with a low media console in front of it.
  g.fill([37, 3, 17], [39, 4, 17], POLISHED);
  g.fill([37, 2, 17], [39, 2, 17], ...B.slab(SPRUCE, "bottom"));

  // Sofa: stair seats facing north (backs to the south) with stair arms at each end, facing the TV.
  for (let x = 36; x <= 39; x++) g.set(x, 2, 20, ...B.stairs(SPRUCE, "south", "bottom"));
  g.set(35, 2, 20, ...B.stairs(SPRUCE, "west", "bottom"));
  g.set(40, 2, 20, ...B.stairs(SPRUCE, "east", "bottom"));

  // Coffee table between sofa and TV (low slab tops).
  g.fill([37, 2, 18], [38, 2, 18], ...B.slab(POLISHED, "top"));

  // Fireplace on the east wall at z24..26: stone breast (x39, y2..3), chiseled firebox centre, mantel slab at y4.
  g.fill([39, 2, 24], [39, 3, 26], STONE_BRICKS);
  g.set(39, 2, 25, CHISELED);
  g.fill([39, 4, 24], [39, 4, 26], ...B.slab("stone_brick", "bottom"));
  // Standing lanterns either side of the hearth: the brightest spot in the room.
  g.set(38, 2, 24, ...B.lantern(false));
  g.set(38, 2, 26, ...B.lantern(false));

  // ---- lighting: hanging lanterns from the y6 ceiling, kept off the openings ---------------------------------------
  for (const [x, z] of [[29, 20], [28, 21], [28, 23], [28, 26], [34, 22], [36, 22], [41, 19], [41, 23], [38, 25], [33, 25], [29, 25]]) {
    g.set(x, 5, z, ...B.lantern(true));
  }
}
