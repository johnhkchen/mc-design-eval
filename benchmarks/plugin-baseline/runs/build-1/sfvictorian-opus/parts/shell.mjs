// P1 MASSING + SHELL (plan.md FLOORS, SITE, OPENINGS, RESERVED): neighbour walls, floors, then walls, then stairs.
// Every OPENING and RESERVED cell stays air; stairs and banisters go into air only (stairFlight's put()).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  wallLine, slab, stairFlight,
  CYAN_TERRACOTTA, YELLOW_TERRACOTTA, LIGHT_BLUE_TERRACOTTA, SMOOTH_QUARTZ, DARK_OAK_STAIRS, DARK_OAK_PLANKS,
  POLISHED_DIORITE, SPRUCE_PLANKS, BIRCH_PLANKS, WHITE_CONCRETE, SMOOTH_STONE,
} from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
const putAir = (g, x, y, z, block, state) => { if (isAir(g, x, y, z)) g.set(x, y, z, block, state); };

export function build(g) {
  // ---- neighbours (E13): west x0 yellow terracotta; east x15 cyan base, light blue body; cornice stairs on z6.
  g.fill([0, 0, 7], [0, 13, 30], YELLOW_TERRACOTTA);
  g.set(0, 14, 6, ...B.stairs("smooth_quartz", "south", "top"));
  g.fill([15, 0, 7], [15, 0, 30], CYAN_TERRACOTTA);
  g.fill([15, 1, 7], [15, 15, 30], LIGHT_BLUE_TERRACOTTA);
  g.set(15, 16, 6, ...B.stairs("smooth_quartz", "south", "top"));

  // ---- floors (FLOORS). Interior only: the walls below own the edges. Stair holes and lightwell cells stay air.
  slab(g, 0, 2, 8, 13, 29, SMOOTH_STONE);
  slab(g, 4, 2, 8, 13, 29, DARK_OAK_PLANKS, { holes: [[13, 4, 16], [13, 4, 17]] });
  slab(g, 4, 2, 26, 13, 29, POLISHED_DIORITE); // kitchen
  slab(g, 4, 11, 8, 13, 9, POLISHED_DIORITE); // porch
  slab(g, 4, 2, 6, 5, 6, DARK_OAK_PLANKS); // bay
  slab(g, 4, 2, 19, 2, 23, SMOOTH_STONE); // lightwell floor (x1 is party wall)
  slab(g, 8, 2, 8, 13, 29, SPRUCE_PLANKS, { holes: [[13, 8, 13, 13, 8, 16], [2, 8, 19, 3, 8, 23]] });
  slab(g, 8, 4, 19, 9, 24, WHITE_CONCRETE); // bathroom
  slab(g, 8, 2, 6, 5, 6, SPRUCE_PLANKS); // bay
  slab(g, 12, 2, 8, 13, 29, BIRCH_PLANKS, { holes: [[13, 12, 17, 13, 12, 20], [2, 12, 19, 3, 12, 23]] }); // z17 too: the stair head needs headroom from (13,10,17)
  slab(g, 12, 2, 6, 5, 6, BIRCH_PLANKS); // bay

  // ---- party walls x1 and x14 (z7..30, y0..16). x1 is open at the lightwell (z19..23 y5+) and the firebox (y5..6, z13).
  wallLine(g, 1, 7, 1, 30, 0, 16, "party", { open: [[1, 5, 13, 1, 6, 13], [1, 5, 19, 1, 16, 23]] });
  wallLine(g, 14, 7, 14, 30, 0, 16, "party", { open: [[14, 5, 7, 14, 7, 7]] }); // (14,5..7,7) porch column

  // ---- front z7: base, bands, siding, frieze; openings per plan OPENINGS (garage, bay mouths, windows, porch mouth).
  wallLine(g, 2, 7, 13, 7, 0, 16, "front", {
    open: [
      [2, 1, 7, 5, 3, 7], [8, 2, 7, 8, 2, 7], // garage, base window
      [2, 5, 7, 5, 7, 7], [2, 9, 7, 5, 11, 7], [2, 13, 7, 5, 15, 7], // bay mouths
      [8, 5, 7, 8, 7, 7], [8, 9, 7, 8, 11, 7], [8, 13, 7, 8, 15, 7], // windows
      [12, 9, 7, 12, 11, 7], [12, 13, 7, 12, 15, 7], // windows
      [10, 5, 7, 13, 7, 7], // porch mouth and columns
    ],
  });
  wallLine(g, 1, 7, 14, 7, 17, 18, "front"); // false front parapet, posts at x1,5,10,14

  // ---- back z30 (y0..16): base door and windows, kitchen door + transom, windows, attic windows.
  wallLine(g, 2, 30, 13, 30, 0, 16, "back", {
    open: [
      [7, 1, 30, 7, 2, 30], [4, 2, 30, 4, 2, 30], [10, 2, 30, 10, 2, 30],
      [7, 5, 30, 7, 7, 30], [4, 5, 30, 4, 7, 30], [10, 5, 30, 10, 7, 30],
      [4, 9, 30, 4, 11, 30], [7, 9, 30, 7, 11, 30], [10, 9, 30, 10, 11, 30],
      [5, 13, 30, 5, 15, 30], [9, 13, 30, 9, 15, 30],
    ],
  });

  // ---- bay (E6): front face z5 x2..5 y4..16, angled faces (1,·,6) and (6,·,6), bay cap row y16 at z6.
  wallLine(g, 2, 5, 5, 5, 4, 16, "front", { open: [[3, 5, 5, 4, 7, 5], [3, 9, 5, 4, 11, 5], [3, 13, 5, 4, 15, 5]] });
  for (const x of [2, 5]) for (const y of [5, 6, 7, 9, 10, 11, 13, 14, 15]) g.set(x, y, 5, SMOOTH_QUARTZ); // corner posts
  for (const x of [1, 6]) {
    wallLine(g, x, 6, x, 6, 4, 16, "front", { open: [[x, 5, 6, x, 7, 6], [x, 9, 6, x, 11, 6], [x, 13, 6, x, 15, 6]] });
  }
  wallLine(g, 2, 6, 5, 6, 16, 16, "front");

  // ---- lightwell (E14): x3 wall z19..23, end walls (1..3, z18) and (1..3, z24), y5..16; openings for the windows.
  wallLine(g, 3, 19, 3, 23, 5, 16, "inner", { open: [[3, 5, 20, 3, 7, 20], [3, 5, 22, 3, 7, 22], [3, 10, 21, 3, 11, 21], [3, 13, 21, 3, 15, 21]] });
  wallLine(g, 1, 18, 3, 18, 5, 16, "inner");
  wallLine(g, 1, 24, 3, 24, 5, 16, "inner");

  // ---- base partition z19 (garage | laundry), laundry door open at (7,1..2,19).
  wallLine(g, 2, 19, 13, 19, 1, 3, "inner", { open: [[7, 1, 19, 7, 2, 19]] });

  // ---- partitions per storey (air y5..7 main, y9..11 second, y13..15 top). Cased and door openings are air.
  // z18: parlour | dining (cased pocket at 5..7), second-floor bedroom | bath, top studio | top landing (door at 11).
  wallLine(g, 1, 18, 9, 18, 5, 7, "inner", { open: [[5, 5, 18, 7, 7, 18]] });
  wallLine(g, 1, 18, 9, 18, 9, 11, "inner");
  wallLine(g, 1, 18, 13, 18, 13, 15, "inner", { open: [[11, 13, 18, 11, 14, 18], [13, 13, 18, 13, 13, 18]] }); // (13,13,18): headroom over the stair head
  // z25: dining | kitchen, bath | back bedroom, top landing | attic (doors at 7 and 12).
  wallLine(g, 2, 25, 13, 25, 5, 7, "inner", { open: [[7, 5, 25, 7, 6, 25], [12, 5, 25, 12, 6, 25]] });
  wallLine(g, 2, 25, 13, 25, 9, 11, "inner", { open: [[12, 9, 25, 12, 10, 25]] });
  wallLine(g, 2, 25, 13, 25, 13, 15, "inner", { open: [[12, 13, 25, 12, 14, 25]] });
  // x10: parlour | entry hall (porch side walls at z8..9 included), second-floor bedroom | upper hall, bath door.
  wallLine(g, 10, 8, 10, 24, 5, 7, "inner", { open: [[10, 5, 12, 10, 7, 13], [10, 5, 21, 10, 6, 21]] });
  wallLine(g, 10, 8, 10, 24, 9, 11, "inner", { open: [[10, 9, 12, 10, 10, 12], [10, 9, 21, 10, 10, 21]] });
  // z10 second floor: sewing room | upper hall (door at 12). Main z10 x11..13 is the porch door (air).
  wallLine(g, 11, 10, 13, 10, 9, 11, "inner", { open: [[12, 9, 10, 12, 10, 10]] });

  // ---- stairs (E20 long run along x13, E21 down to the garage) and banisters, into air only.
  stairFlight(g, 13, 13, 5, 3, "south", DARK_OAK_STAIRS);
  stairFlight(g, 13, 16, 8, 1, "south", DARK_OAK_STAIRS); // one step over the 2nd-floor hole: the flights meet at y9
  stairFlight(g, 13, 17, 9, 3, "south", DARK_OAK_STAIRS);
  stairFlight(g, 13, 15, 1, 3, "south", DARK_OAK_STAIRS);
  // (12,13,19) is not a banister: it is the only way off the top stair head (the landing cell (13,12,20) is a hole).
  for (const [x, y, z] of [[12, 5, 16], [12, 5, 17], [12, 9, 13], [12, 9, 14], [12, 9, 15]]) {
    putAir(g, x, y, z, ...B.fence("dark_oak"));
  }
}
