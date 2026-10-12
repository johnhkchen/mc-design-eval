// PART 4: GARDEN FEATURES (rose arches, espaliered fruit trees, glasshouse, cold frame, tool shed, sundial, urn, lamp posts).
// Ticks elements.md: E15 (rose/bean arches), E16 (espaliers), E17 (greenhouse), E18 (cold frame), E19 (tool shed), E14b (sundial + urn), E8b (garden lamps).
// Import from ../vocab.mjs: roseArch, espalier, greenhouse, coldFrame, toolShed, lamp, door, OPENINGS, GREENHOUSE, SHED, COLDFRAME, pot, B.
// Notes: sundial and urn use local implementations (vocab versions use lightning_rod which is not in palette).
//
// BUILD (everything is inside the garden wall, x=21..37, z=5..31; potager part 3 already owns paths, walls, beds, well):
//  1. ROSE ARCHES over the E-W path: roseArch(g,{x:24,zA:14,zB:16}) and roseArch(g,{x:34,zA:14,zB:16}). They put coarse_dirt under the rose bushes at y=0;
//     those writes are refused where part 3 laid gravel, which is fine (roses may sit on gravel).
//  2. ESPALIERS (fruit trees trained against the wall, spine cell NEXT to the wall):
//       west wall (wall:"west", x=21): z=8, 12, 19, 23   (leaf OAK_LEAVES for z=8,19; BLOSSOM flowering_azalea_leaves for z=12,23)
//       east wall (wall:"east", x=37): z=8, 12, 19, 23   (mirror leaf choice)
//       north wall (wall:"north", z=5): x=24, 34          (blossom)
//     espalier(g,{x,z,wall,leaf}). Its coarse_dirt at y=0 is refused where part 3 laid a path: fine.
//  3. GLASSHOUSE: greenhouse(g,GREENHOUSE) (x=22..27, z=27..31; door gap (25,1..2,27): door(g,{x:25,y:1,z:27,face:"north",mat:"oak"})).
//     Inside: a potting bench of B.slab("spruce","bottom") at (23..26,1,30) with pots on y=2 via pot(): flower blocks;
//     composter g.set(23,1,28,"composter"); water cauldron g.set(26,1,28,"cauldron"); lantern(g,24,2,30) on the bench.
//  4. COLD FRAME: coldFrame(g,COLDFRAME) (x=32..36, z=26..27).
//  5. TOOL SHED: toolShed(g,SHED) (x=32..36, z=28..31; door gap (32,1..2,29) facing west: door(g,{x:32,y:1,z:29,face:"west",mat:"spruce"})).
//     Inside: g.set(33,1,30,"crafting_table"), barrel(g,34,1,30), barrel(g,35,1,30), chest(g,36,1,30,"west"), slab (33,1,28),
//     hay_block (35,1,28), composter (36,1,28), lantern(g,34,1,28) standing on the floor. No window is needed.
//  6. SUNDIAL at (29,1,6) (north end of the main N-S path, on the brick line) and URN at (29,1,25) on the margin.
//  7. LAMP POSTS (lamp(g,x,1,z,3)): (27,14), (27,16), (31,14), (31,16) (path edges by the well), (28,6), (30,6) (by the sundial), (28,24), (30,24).
//  8. Small touches: rows of flowers along the base of the north wall z=5: "cornflower" / "poppy" / "allium" at y=1 on the margin (x=22,23,25,26,27,31,32,33,35,36).
// Check: render the back-left iso and a --view of the garden from the gate: arches, trained trees, glasshouse and shed must read.
import { roseArch, espalier, greenhouse, coldFrame, toolShed, lamp, door, chest, barrel, lantern, OPENINGS, GREENHOUSE, SHED, COLDFRAME, pot, B, LEAF, BLOSSOM } from "../vocab.mjs";

// Local helper: sundial with stone-brick pedestal and smooth-stone dial (no lightning_rod in palette)
function localSundial(g, { x, z, y = 1 }) {
  g.set(x, y, z, ...B.wall("stone_brick"));
  g.set(x, y + 1, z, ...B.wall("stone_brick"));
  g.set(x, y + 2, z, ...B.slab("smooth_stone", "bottom"));
  // Use a stone_brick slab as the gnomon top instead of lightning_rod
  g.set(x, y + 3, z, ...B.slab("stone_brick", "top"));
}

// Local helper: urn on a pedestal
function localUrn(g, { x, z, y = 1 }) {
  g.set(x, y, z, ...B.wall("stone_brick"));
  g.set(x, y + 1, z, "stone_bricks");
  g.set(x, y + 2, z, "decorated_pot");
}

export function build(g) {
  // 1. ROSE ARCHES (x=24 and x=34 spanning z=14..16)
  roseArch(g, { x: 24, zA: 14, zB: 16 });
  roseArch(g, { x: 34, zA: 14, zB: 16 });

  // 2. ESPALIERS (fruit trees trained against the walls)
  // West wall (x=21) at z=8, 12, 19, 23
  espalier(g, { x: 21, z: 8, wall: "west", leaf: LEAF });        // oak leaves
  espalier(g, { x: 21, z: 12, wall: "west", leaf: BLOSSOM });    // flowering azalea (blossom)
  espalier(g, { x: 21, z: 19, wall: "west", leaf: LEAF });       // oak leaves
  espalier(g, { x: 21, z: 23, wall: "west", leaf: BLOSSOM });    // blossom

  // East wall (x=37) at z=8, 12, 19, 23 (mirror of west)
  espalier(g, { x: 37, z: 8, wall: "east", leaf: LEAF });        // oak leaves
  espalier(g, { x: 37, z: 12, wall: "east", leaf: BLOSSOM });    // blossom
  espalier(g, { x: 37, z: 19, wall: "east", leaf: LEAF });       // oak leaves
  espalier(g, { x: 37, z: 23, wall: "east", leaf: BLOSSOM });    // blossom

  // North wall (z=5) at x=24, 34 (blossom)
  espalier(g, { x: 24, z: 5, wall: "north", leaf: BLOSSOM });
  espalier(g, { x: 34, z: 5, wall: "north", leaf: BLOSSOM });

  // 3. GLASSHOUSE (x=22..27, z=27..31)
  greenhouse(g, GREENHOUSE);
  // Door at (25, 1..2, 27) facing north
  door(g, { x: 25, y: 1, z: 27, face: "north", mat: "oak" });
  // Interior: potting bench at (23..26, 1, 30) with pots on y=2
  for (let x = 23; x <= 26; x++) g.set(x, 1, 30, ...B.slab("spruce", "bottom"));
  pot(g, 23, 2, 30, "fern");
  pot(g, 24, 2, 30, "peony");
  pot(g, 25, 2, 30, "red_tulip");
  pot(g, 26, 2, 30, "oxeye_daisy");
  // Composter and water cauldron
  g.set(23, 1, 28, "composter");
  g.set(26, 1, 28, "cauldron");
  // Hanging lantern over the bench
  lantern(g, 24, 2, 30);

  // 4. COLD FRAME (x=32..36, z=26..27)
  coldFrame(g, COLDFRAME);

  // 5. TOOL SHED (x=32..36, z=28..31)
  toolShed(g, SHED);
  // Door at (32, 1..2, 29) facing west
  door(g, { x: 32, y: 1, z: 29, face: "west", mat: "spruce" });
  // Interior furniture
  g.set(33, 1, 30, "crafting_table");
  barrel(g, 34, 1, 30);
  barrel(g, 35, 1, 30);
  chest(g, 36, 1, 30, "west");
  g.set(33, 1, 28, "spruce_slab");  // grindstone not available; use slab for height variation
  g.set(35, 1, 28, "hay_block");
  g.set(36, 1, 28, "composter");
  lantern(g, 34, 1, 28);

  // 6. SUNDIAL and URN (on the main N-S path axis)
  localSundial(g, { x: 29, z: 6 });  // North end
  localUrn(g, { x: 29, z: 25 });      // South end (on the margin)

  // 7. LAMP POSTS (fence posts with lanterns on top)
  // Path edges by the well: (27,14), (27,16), (31,14), (31,16)
  lamp(g, 27, 1, 14, 3);
  lamp(g, 27, 1, 16, 3);
  lamp(g, 31, 1, 14, 3);
  lamp(g, 31, 1, 16, 3);
  // By the sundial: (28,6), (30,6)
  lamp(g, 28, 1, 6, 3);
  lamp(g, 30, 1, 6, 3);
  // By the urn: (28,24), (30,24)
  lamp(g, 28, 1, 24, 3);
  lamp(g, 30, 1, 24, 3);

  // 8. FLOWER EDGING (along the base of the north wall z=5)
  // Cornflower, poppy, allium at y=1 on the margin
  const flowers = ["cornflower", "poppy", "allium", "cornflower", "poppy", "allium", "cornflower", "poppy", "allium", "cornflower"];
  const xPositions = [22, 23, 25, 26, 27, 31, 32, 33, 35, 36];
  for (let i = 0; i < xPositions.length; i++) {
    g.set(xPositions[i], 1, 5, flowers[i]);
  }
}
