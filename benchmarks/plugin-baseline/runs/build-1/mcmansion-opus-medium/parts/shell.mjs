// P1 shell: foundation, every exterior wall (E1..E5, E12 walls, E38 garage front shell), turret, entry projection,
// garage wing, quoins, partitions, floors and ceilings (E17 shell, E20), sweeping stair + gallery railing (E21),
// chimney (E14). Every plan.md OPENING is left AIR, and so are the cells P3 needs for its entry casing/Palladian and
// the carriage-door headers (y4 over each garage door). Only air is written by later parts.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { veneer, wallLine, wallCell, quoin, partition, sweepStair } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);
const span = (a, b) => [Math.min(a, b), Math.max(a, b)];

/** Fill an inclusive box with one block id. */
function fill(g, [x0, y0, z0], [x1, y1, z1], name) {
  const [xa, xb] = span(x0, x1), [ya, yb] = span(y0, y1), [za, zb] = span(z0, z1);
  for (let x = xa; x <= xb; x++) for (let y = ya; y <= yb; y++) for (let z = za; z <= zb; z++) put(g, x, y, z, B.block(name));
}

export function build(g) {
  foundation(g);
  walls(g);
  floors(g);
  ceilings(g);
  partitions(g);
  sweepStair(g);
  chimney(g);
}

/** Foundation y0: stone_bricks under the house, turret and entry; smooth_stone floor for the garage. */
function foundation(g) {
  fill(g, [2, 0, 11], [29, 0, 25], "stone_bricks");
  fill(g, [2, 0, 7], [7, 0, 10], "stone_bricks");
  fill(g, [12, 0, 9], [21, 0, 10], "stone_bricks");
  fill(g, [30, 0, 13], [41, 0, 25], "smooth_stone");
}

function walls(g) {
  // Main front, north z11 (x2..29). Turret mouths (3..6), archWindows (8..9, 23..24, 26..27), the foyer run x13..20 y2..8.
  wallLine(g, 2, 11, 29, 11, "front", { open: [
    [3, 2, 11, 6, 4, 11], [3, 6, 11, 6, 8, 11], [8, 2, 11, 9, 4, 11], [8, 6, 11, 9, 8, 11], [13, 2, 11, 20, 8, 11],
    [23, 2, 11, 24, 4, 11], [26, 2, 11, 27, 4, 11], [23, 6, 11, 24, 8, 11], [26, 6, 11, 27, 8, 11]] });
  // Turret x2..7 is walled to y11 on its back (main z11) as well.
  for (let x = 2; x <= 7; x++) for (let y = 10; y <= 11; y++) wallCell(g, x, y, 11, "front");

  // Entry projection: front z9 (x12..21), with the door casing/sidelights/fanlight and Palladian left air (P3), and the sides.
  wallLine(g, 12, 9, 21, 9, "front", { open: [[14, 2, 9, 19, 4, 9], [15, 6, 9, 18, 8, 9]] });
  wallLine(g, 12, 10, 12, 10, "other");
  wallLine(g, 21, 10, 21, 10, "other");

  // Turret octagon, walls y1..11: front z7 (x3..6) with its two archWindows, chamfers (2,8),(7,8), sides x2/x7 at z9..10.
  wallLine(g, 3, 7, 6, 7, "front", { yTo: 11, open: [[4, 2, 7, 5, 4, 7], [4, 6, 7, 5, 8, 7]] });
  wallLine(g, 2, 8, 2, 8, "front", { yTo: 11 });
  wallLine(g, 7, 8, 7, 8, "front", { yTo: 11 });
  wallLine(g, 2, 9, 2, 10, "front", { yTo: 11 });
  wallLine(g, 7, 9, 7, 10, "front", { yTo: 11 });

  // West wall x2, z12..25: the family-room windows (13..14 at y2..3 and y6..7) and the firebox (2,2..3,21..22) stay air.
  wallLine(g, 2, 12, 2, 25, "other", { open: [[2, 2, 13, 2, 3, 14], [2, 6, 13, 2, 7, 14], [2, 2, 21, 2, 3, 22]] });

  // East wall x29: z12 main, z14..24 shared with the garage; the mudroom door (y2..3) and the bedroom-hall door (y6..7).
  wallLine(g, 29, 12, 29, 12, "other");
  wallLine(g, 29, 14, 29, 24, "other", { open: [[29, 2, 22, 29, 3, 22], [29, 6, 16, 29, 7, 16]] });

  // Back z25 (x2..41, main + garage): every back window, the deck/mudroom/kitchen/garage doors.
  wallLine(g, 2, 25, 41, 25, "other", { open: [
    [5, 2, 25, 6, 4, 25], [9, 2, 25, 10, 4, 25], [16, 2, 25, 17, 3, 25], [20, 3, 25, 22, 4, 25], [27, 2, 25, 27, 3, 25],
    [35, 2, 25, 36, 3, 25], [5, 6, 25, 6, 7, 25], [9, 6, 25, 10, 7, 25], [19, 7, 25, 20, 8, 25], [25, 6, 25, 26, 7, 25],
    [35, 6, 25, 36, 7, 25]] });

  // Garage front z13 (x29..41): carriage-door openings y1..4 (P3 writes the trapdoors, glass and y4 header),
  // and the three bonus-room windows at y6..7.
  wallLine(g, 29, 13, 41, 13, "front", { open: [
    [30, 1, 13, 32, 4, 13], [34, 1, 13, 36, 4, 13], [38, 1, 13, 40, 4, 13],
    [31, 6, 13, 31, 7, 13], [35, 6, 13, 35, 7, 13], [39, 6, 13, 39, 7, 13]] });
  // Garage east wall x41, z14..24: two bonus-room windows.
  wallLine(g, 41, 14, 41, 24, "other", { open: [[41, 6, 17, 41, 7, 18], [41, 6, 21, 41, 7, 22]] });

  // Quoins: front corners on the siding courses (y6..8), side/back corners on every siding course.
  quoin(g, 2, 11, null, "south", 6, 8);
  quoin(g, 29, 11, "west", null, 6, 8);
  quoin(g, 12, 9, "east", null, 6, 8);
  quoin(g, 21, 9, "west", null, 6, 8);
  quoin(g, 41, 13, "west", null, 6, 8);
  quoin(g, 2, 25, "east", "north", 2, 8);
  quoin(g, 29, 25, "east", "north", 2, 8);
  quoin(g, 41, 25, "west", "north", 2, 8);
}

/** Ground floors y1 (per ROOMS), the foyer's marble field with its checker, and the upper floor y5 (foyer void, stair top left). */
function floors(g) {
  fill(g, [3, 1, 12], [28, 1, 24], "oak_planks");
  fill(g, [3, 1, 8], [6, 1, 10], "oak_planks");
  fill(g, [14, 1, 19], [24, 1, 24], "smooth_stone");
  fill(g, [26, 1, 19], [28, 1, 24], "polished_andesite");
  for (let x = 13; x <= 20; x++) for (const z of [10, 12, 13, 14, 15, 16, 17]) {
    // Foyer: polished_diorite field, smooth_quartz 2x2 checker over x15..18 z12..15 (z11 is wall at y1).
    const inlay = x >= 15 && x <= 18 && z >= 12 && z <= 15;
    const checker = (Math.floor((x - 15) / 2) + Math.floor((z - 12) / 2)) % 2 === 0;
    put(g, x, 1, z, B.block(inlay && checker ? "smooth_quartz" : "polished_diorite"));
  }
  for (let x = 3; x <= 28; x++) for (let z = 12; z <= 24; z++) {
    // Upper floor y5: skip the foyer void (x13..20 z12..14) and the stair top cells (x18..20 z15, sweepStair's).
    if (x >= 13 && x <= 20 && z <= 14) continue;
    if (x >= 18 && x <= 20 && z === 15) continue;
    const bath = x >= 17 && x <= 21 && z >= 19;
    put(g, x, 5, z, B.block(bath ? "white_concrete" : "oak_planks"));
  }
  fill(g, [3, 5, 8], [6, 5, 10], "oak_planks");
  fill(g, [30, 5, 14], [40, 5, 24], "oak_planks");
}

/** Ceiling y9 smooth_quartz over every room (house, foyer, turret, garage). */
function ceilings(g) {
  fill(g, [3, 9, 12], [28, 9, 24], "smooth_quartz");
  fill(g, [13, 9, 10], [20, 9, 10], "smooth_quartz");
  fill(g, [3, 9, 8], [6, 9, 10], "smooth_quartz");
  fill(g, [30, 9, 14], [40, 9, 24], "smooth_quartz");
}

/** Interior partitions (birch_planks), ground air y2..4 and upper air y6..8, with the plan's doorways left open. */
function partitions(g) {
  partition(g, 12, 12, 12, 17, 2, 4, { open: [[12, 2, 15, 12, 3, 15]] });
  partition(g, 21, 12, 21, 17, 2, 4, { open: [[21, 2, 13, 21, 4, 14]] });
  partition(g, 3, 18, 28, 18, 2, 4, { open: [[15, 2, 18, 18, 4, 18], [23, 2, 18, 23, 3, 18]] });
  partition(g, 25, 19, 25, 24, 2, 4, { open: [[25, 2, 21, 25, 3, 21]] });

  partition(g, 3, 15, 12, 15, 6, 8, { open: [[8, 6, 15, 8, 7, 15]] });
  partition(g, 21, 15, 28, 15, 6, 8, { open: [[24, 6, 15, 24, 7, 15]] });
  partition(g, 3, 18, 28, 18, 6, 8, { open: [[9, 6, 18, 9, 7, 18], [25, 6, 18, 25, 7, 18]] });
  partition(g, 12, 19, 12, 24, 6, 8, { open: [[12, 6, 22, 12, 7, 22]] });
  partition(g, 16, 19, 16, 24, 6, 8, { open: [[16, 6, 22, 16, 7, 22]] });
  partition(g, 22, 19, 22, 24, 6, 8);
  // Not in the plan's partition list: the bedroom 2 and bedroom 3 walls against the open foyer void (x12/x21, z12..14).
  partition(g, 12, 12, 12, 14, 6, 8);
  partition(g, 21, 12, 21, 14, 6, 8);
}

/** Chimney x0..1 z20..23 to y15: veneer stack, stone brick shoulders at y10 (z20 south, z23 north), campfire smoke cap. */
function chimney(g) {
  for (let y = 0; y <= 9; y++) for (let x = 0; x <= 1; x++) for (let z = 20; z <= 23; z++) put(g, x, y, z, B.block(veneer(x, y, z)));
  for (const x of [0, 1]) {
    put(g, x, 10, 20, B.stairs("stone_brick", "south", "bottom"));
    put(g, x, 10, 23, B.stairs("stone_brick", "north", "bottom"));
    for (let y = 10; y <= 14; y++) for (const z of [21, 22]) put(g, x, y, z, B.block(veneer(x, y, z)));
    put(g, x, 15, 22, B.slab("stone_brick", "bottom"));
    put(g, x, 15, 21, ["campfire", { lit: "true", signal_fire: "false", waterlogged: "false", facing: "north" }]);
  }
}
