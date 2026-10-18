// Part "shell west (plots 0-3)": foundations, walls, floors, stair holes + flights, openings left unset.
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// plot 2's roof profile: z -> [slab y, type] (half pitch, ridge z16); the shell's end walls and roofs.mjs follow it
export const P2_SLABS = { 9: [6, "bottom"], 10: [6, "top"], 11: [7, "bottom"], 12: [7, "top"], 13: [8, "bottom"], 14: [8, "top"],
  15: [9, "bottom"], 16: [9, "top"], 17: [9, "bottom"], 18: [8, "top"], 19: [8, "bottom"], 20: [7, "top"], 21: [7, "bottom"], 22: [6, "top"] };

// plot 3's gambrel: z -> [slab y, type] of the shallow upper slope (ridge z17); the lower slope is the vertical slate y5..8
export const P3_SLABS = { 13: [9, "bottom"], 14: [9, "top"], 15: [10, "bottom"], 16: [10, "top"], 17: [11, "bottom"],
  18: [10, "top"], 19: [10, "bottom"], 20: [9, "top"], 21: [9, "bottom"] };

// openings as [x0,y0,z0,x1,y1,z1] left out of the walls
const win = (face, a0, a1, ys) => ys.map(([y0, y1]) => face.horiz ? [a0, y0, face.at, a1, y1, face.at] : [face.at, y0, a0, face.at, y1, a1]);
const N = (z) => ({ horiz: true, at: z });
const E = (x) => ({ horiz: false, at: x });
const G = [2, 3], U = [6, 7], GU = [G, U];

// is (x,y,z) inside one of the boxes [x0,y0,z0,x1,y1,z1]
const inBoxes = (boxes, x, y, z) => boxes.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);

// a walled box: stone footing at y0, plinth + floor at y1, body y2..top, corner boards, band, openings.
// Only the walls (the outer ring) and the floors are written, and an opening is never written at all: an air write
// would lock the cell for the glazing, doors and rooms after this part (runParts refuses writes into any cell an earlier
// part set, air included), so the windows could not be glazed and the furniture could not stand in the rooms' air.
function house(g, { x0, x1, z0, z1, top, base, body, floor, corner = null, band = null, bandY = 5, holes = [], upper = null }) {
  const ring = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) ring.push([x, z]);
  const put = (x, y, z, block, state) => { if (!inBoxes(holes, x, y, z)) g.set(x, y, z, block, state); };
  g.fill([x0, 0, z0], [x1, 0, z1], "cobblestone");
  for (const [x, z] of ring) put(x, 1, z, base);
  g.fill([x0 + 1, 1, z0 + 1], [x1 - 1, 1, z1 - 1], floor);
  for (const [x, z] of ring) for (let y = 2; y <= top; y++) put(x, y, z, body);
  if (corner) for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) for (let y = 2; y <= top; y++) put(cx, y, cz, corner[0], corner[1]);
  if (band && top >= bandY) for (const [x, z] of ring) put(x, bandY, z, band);
  if (upper) g.fill([upper[0], 5, upper[1]], [upper[2], 5, upper[3]], floor);
}

export function build(g) {
  // ---- plot 0 Magnolia ----
  house(g, { x0: 2, x1: 13, z0: 13, z1: 21, top: 8, base: "bricks", body: "white_concrete", floor: "dark_oak_planks",
    corner: ["quartz_pillar", { axis: "y" }], band: "smooth_quartz", upper: [3, 14, 12, 20],
    holes: [
      ...win(N(13), 3, 4, GU), ...win(N(13), 11, 12, GU), ...win(N(13), 6, 6, GU), ...win(N(13), 9, 9, GU),
      ...win(N(13), 7, 8, GU), [7, 4, 13, 8, 4, 13],
      ...win(E(2), 14, 15, GU), ...win(E(2), 19, 20, GU), ...win(E(13), 14, 15, GU), ...win(E(13), 19, 20, GU),
      ...win(N(21), 4, 5, GU), ...win(N(21), 10, 11, GU), [8, 2, 21, 8, 3, 21],
      [2, 1, 17, 2, 3, 17], [13, 1, 17, 13, 3, 17],
    ] });
  // attic floor y9 with the ladder hole at (11,9,17)
  g.fill([5, 9, 15], [11, 9, 19], "dark_oak_planks");
  g.fill([11, 9, 17], [11, 9, 17], "air");
  flight(g, { from: [6, 2, 15], facing: "south", to: 5 });
  // the attic ladder (x11, z17, y6..10) hangs from this one-cell partition at x11 z18 (the east bedroom's west column)
  for (let y = 6; y <= 10; y++) g.set(11, y, 18, "dark_oak_planks");

  // ---- plot 1 Alhambra ----
  house(g, { x0: 18, x1: 29, z0: 13, z1: 21, top: 8, base: "mud_bricks", body: "white_terracotta", floor: "oak_planks",
    upper: [19, 14, 28, 20],
    holes: [
      ...win(N(13), 20, 21, [G]), ...win(N(13), 26, 27, [G]), ...win(N(13), 23, 24, [G]),
      ...win(N(13), 19, 20, [U]), ...win(N(13), 23, 24, [U]), ...win(N(13), 27, 28, [U]),
      ...win(E(18), 15, 16, GU), ...win(E(18), 18, 19, GU), ...win(E(29), 15, 16, GU), ...win(E(29), 18, 19, GU),
      ...win(N(21), 20, 21, GU), [24, 2, 21, 24, 3, 21], [27, 1, 21, 27, 3, 21],
    ] });
  flight(g, { from: [22, 2, 15], facing: "south", to: 5 });

  // ---- plot 2 Vallonia (walls y2..4, belt y4 on the front) ----
  house(g, { x0: 35, x1: 45, z0: 13, z1: 21, top: 4, base: "cobblestone", body: "lime_terracotta", floor: "oak_planks",
    upper: [36, 14, 44, 18],
    holes: [
      ...win(N(13), 36, 38, [G]), ...win(N(13), 42, 44, [G]), [40, 2, 13, 40, 3, 13],
      ...win(E(35), 14, 15, [G]), ...win(E(35), 19, 20, [G]), ...win(E(45), 14, 15, [G]), ...win(E(45), 19, 20, [G]),
      ...win(N(21), 37, 38, [G]), ...win(N(21), 42, 43, [G]), [40, 2, 21, 40, 3, 21],
      [35, 1, 17, 35, 3, 17],
    ] });
  g.fill([35, 4, 13], [45, 4, 13], "stripped_spruce_log", { axis: "x" });
  flight(g, { from: [44, 2, 18], facing: "north", to: 5 });
  // gable-end windows (z16..17 y6..7) are left to the roof's gable infill
  // the side gable ends of the loft (the cottage has no gable infill of its own): walls y5..8 at x35 and x45 for z14..20,
  // with the gable pairs left out (x35 z18..19 and x45 z16..17, y6..7; fittings.mjs)
  const gableEnd = [[35, 6, 18, 35, 7, 19], [45, 6, 16, 45, 7, 17]];
  // low half-pitch sweep (roofs.mjs P2_SLABS): the end walls rise under it, one cell below its slab at each z
  for (const x of [35, 45]) for (let z = 14; z <= 20; z++) for (let y = 5; y < P2_SLABS[z][0]; y++) if (!inBoxes(gableEnd, x, y, z)) g.set(x, y, z, "lime_terracotta");
  // raised front (y5..7; the wide shed dormer y8 over x36..44) and back (y5..6) walls under the sweep, the dormer's window pairs
  for (let x = 35; x <= 45; x++) {
    for (let y = 5; y <= 7; y++) g.set(x, y, 13, "lime_terracotta");
    for (let y = 5; y <= 6; y++) g.set(x, y, 21, "lime_terracotta");
  }
  for (let x = 36; x <= 44; x++) g.set(x, 8, 13, "spruce_planks");
  for (const x of [37, 38, 42, 43]) { g.fill([x, 6, 13], [x, 7, 13], "glass_pane", { east: "true", west: "true" }); }
  // the loft partition at x41 between the two loft bedrooms (rooms 20 and 21 put their beds' heads on it); its doorway at
  // (41, 6..7, 16) is left unset for the rooms
  for (let z = 14; z <= 18; z++) for (let y = 6; y <= 8; y++) if (!(z === 16 && y <= 7)) g.set(41, y, z, "spruce_planks");

  // ---- plot 3 Puritan (ground walls y2..4, birch gambrel end walls) ----
  house(g, { x0: 51, x1: 61, z0: 13, z1: 21, top: 4, base: "stone_bricks", body: "birch_planks", floor: "oak_planks",
    corner: ["smooth_quartz", {}], upper: [52, 14, 60, 20],
    holes: [
      ...win(N(13), 52, 53, [G]), ...win(N(13), 59, 60, [G]), [56, 2, 13, 56, 3, 13],
      ...win(E(51), 14, 15, [G]), ...win(E(51), 19, 20, [G]), ...win(E(61), 14, 15, [G]), ...win(E(61), 19, 20, [G]),
      ...win(N(21), 53, 54, [G]), [58, 2, 21, 58, 3, 21],
      [51, 1, 17, 51, 3, 17],
    ] });
  // gambrel (roofs.mjs P3_SLABS): a vertical lower slope y5..8 front and back, a shallow slab upper slope; the birch end walls
  // rise under it, with the end-pair openings left out (y6..7)
  const gambrelGap = [[61, 6, 17, 61, 7, 18], [51, 6, 19, 51, 7, 20]];
  for (const x of [51, 61]) for (let z = 14; z <= 20; z++) for (let y = 5; y < P3_SLABS[z][0]; y++) if (!inBoxes(gambrelGap, x, y, z)) g.set(x, y, z, "birch_planks");
  // the lower slope as steep spruce shingle courses (a different material from the slate upper slope, so the break reads) across the rear and the front cheeks; the long shed dormer face (birch, y5..9) between,
  // its window pairs (x54..55, 57..58, y6..7) left open for the fittings
  const dormerGlass = [[54, 6, 13, 55, 7, 13], [57, 6, 13, 58, 7, 13]];
  for (let x = 51; x <= 61; x++) for (let y = 5; y <= 9; y++) {
    if (x >= 53 && x <= 59) { if (!inBoxes(dormerGlass, x, y, 13)) g.set(x, y, 13, "birch_planks"); }
    else if (y <= 8) g.set(x, y, 13, "spruce_planks");
    if (y <= 8) g.set(x, y, 21, "spruce_planks");
  }
  for (const x of [53, 59]) g.set(x, 9, 14, "birch_planks");
  flight(g, { from: [55, 2, 15], facing: "south", to: 5 });
}
