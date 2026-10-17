// Part: shells plots 4-7 (church nave and tower shaft, tobacco barn, corn crib, granary, owner's brick house with bay).
// Walls, plinths, floors, posts and belts only. Every opening, window, door, lancet, vent and RESERVED cell is left as air
// (the `leave` boxes), so the openings, belfry, chimneys and fittings trades can write into them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { boardWall, slatCrib, bayWindow, belfry } from "../vocab.mjs";

const WHITE = "white_concrete", CALCITE = "calcite", STONE_BRICKS = "stone_bricks", SPRUCE_PLANKS = "spruce_planks";
const BRICKS = "bricks", COBBLE = "cobblestone", OAK_PLANKS = "oak_planks", SLOG_OAK = "stripped_oak_log";
const DARK_LOG = "stripped_dark_oak_log", SLOG_SPRUCE = "stripped_spruce_log", SMOOTH_SLAB = "smooth_stone_slab";

const inBox = (x, y, z, b) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];
const held = (x, y, z, leave) => leave.some((b) => inBox(x, y, z, b));

// Every cell on the outer skin of a box (inclusive) written as block, except the holes. Interior cells are left as they are.
function skin(g, [x0, y0, z0, x1, y1, z1], block, leave = []) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) {
        if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
        if (held(x, y, z, leave)) continue;
        g.set(x, y, z, block);
      }
}

// A filled box (inclusive) written as block, except the holes.
function solid(g, [x0, y0, z0, x1, y1, z1], block, leave = []) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) if (!held(x, y, z, leave)) g.set(x, y, z, block);
}

// The plinth or sill ring at height y round a box: the outer cells only, the interior left for the floor.
function ring(g, [x0, z0, x1, z1], y, block, leave = []) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if ((x === x0 || x === x1 || z === z0 || z === z1) && !held(x, y, z, leave)) g.set(x, y, z, block);
}

// ---- plot 4: the church -----------------------------------------------------------------------------------------
// Nave x49..56, z9..17, floor y1, walls y2..7; the tower x51..54 z9..12 rises from the front, y8..15, belfry y16..17.
function church(g) {
  // plinth (y1 ring) and the nave floor inside it
  ring(g, [49, 9, 56, 17], 1, STONE_BRICKS);
  solid(g, [50, 1, 10, 55, 1, 16], SPRUCE_PLANKS);

  // lancets: x49 and x56, z11/13/15, y2..7 (sill, glass, stair head) and the stair-head cells at y7 stay air
  const lancets = [
    [49, 2, 11, 49, 7, 11], [49, 2, 13, 49, 7, 13], [49, 2, 15, 49, 7, 15],
    [49, 7, 10, 49, 7, 10], [49, 7, 12, 49, 7, 12], [49, 7, 14, 49, 7, 14], [49, 7, 16, 49, 7, 16],
    [56, 2, 11, 56, 7, 11], [56, 2, 13, 56, 7, 13], [56, 2, 15, 56, 7, 15],
    [56, 7, 10, 56, 7, 10], [56, 7, 12, 56, 7, 12], [56, 7, 14, 56, 7, 14],
  ];

  // front gable wall z9: door x52..53 y2..4 (transom y4) and the lintel band y5 x51..54 (calcite stairs upside down)
  boardWall(g, [49, 2, 9, 56, 7, 9], { plank: WHITE, post: CALCITE, batten: 3, leave: [[52, 2, 9, 53, 4, 9], [51, 5, 9, 54, 5, 9]] });
  for (let x = 51; x <= 54; x++) g.set(x, 5, 9, ...B.stairs("quartz", "south", "top"));

  // back wall z17 (the altar window sits in the gable above, the roof part's)
  boardWall(g, [49, 2, 17, 56, 7, 17], { plank: WHITE, post: CALCITE, batten: 3 });

  // side walls with the lancet bays left open
  boardWall(g, [49, 2, 10, 49, 7, 16], { plank: WHITE, post: CALCITE, batten: 3, leave: lancets });
  boardWall(g, [56, 2, 10, 56, 7, 16], { plank: WHITE, post: CALCITE, batten: 3, leave: lancets });

  // side eave cornice at y8 on both side walls: a full calcite course, so the roof's first course at y9 sits flush on it
  // (a bottom slab here leaves half a block of air under the roof)
  for (let z = 9; z <= 17; z++) {
    g.set(49, 8, z, CALCITE, {});
    g.set(56, 8, z, CALCITE, {});
  }

  // tower shaft x51..54 z9..12, y8..15: white walls, calcite corners; round window (y11..12, z9) left open
  boardWall(g, [51, 8, 9, 54, 15, 9], { plank: WHITE, post: CALCITE, batten: 3, leave: [[52, 11, 9, 53, 12, 9]] });
  boardWall(g, [51, 8, 10, 51, 15, 11], { plank: WHITE, post: CALCITE, batten: 3 });
  boardWall(g, [54, 8, 10, 54, 15, 11], { plank: WHITE, post: CALCITE, batten: 3 });
  boardWall(g, [51, 8, 12, 54, 15, 12], { plank: WHITE, post: CALCITE, batten: 3 });

  // belfry storey y16..17 (open storey with its bell, from the library)
  belfry(g, 51, 16, 9);
  // the belfry floor at y15 (the ladder's hole at (52, 15, 11) is the ladder's) and the ceiling deck at y18 that the bell
  // hangs from (its ceiling attachment needs (52, 18, 10) solid)
  for (const [x, z] of [[52, 10], [53, 10], [53, 11]]) g.set(x, 15, z, SPRUCE_PLANKS, {});
  solid(g, [51, 18, 9, 54, 18, 12], CALCITE);
}

// ---- plot 5: the tobacco barn -----------------------------------------------------------------------------------
// Barn x63..68, z9..15, cobblestone sill y1, dark boards y2..10, vent columns and door/firebox openings left open.
function barn(g) {
  // floor at grade (y0) inside the sill
  solid(g, [64, 0, 10, 67, 0, 14], COBBLE);

  // cobblestone sill ring at y1; the door (x65..66, z9) and the firebox mouth (65, 1, 15) stay air
  ring(g, [63, 9, 68, 15], 1, COBBLE, [[65, 1, 9, 66, 1, 9], [65, 1, 15, 65, 1, 15]]);

  // boards: front and back full width, sides between; vents (x63/x68, z10/12/14, y3..9) and the door opening left open
  const vents = [[63, 3, 10, 63, 9, 10], [63, 3, 12, 63, 9, 12], [63, 3, 14, 63, 9, 14],
                 [68, 3, 10, 68, 9, 10], [68, 3, 12, 68, 9, 12], [68, 3, 14, 68, 9, 14]];
  boardWall(g, [63, 2, 9, 68, 10, 9], { plank: DARK_LOG, post: DARK_LOG, batten: 3, leave: [[65, 2, 9, 66, 3, 9]] });
  boardWall(g, [63, 2, 15, 68, 10, 15], { plank: DARK_LOG, post: DARK_LOG, batten: 3 });
  boardWall(g, [63, 2, 10, 63, 10, 14], { plank: DARK_LOG, post: DARK_LOG, batten: 3, leave: vents });
  boardWall(g, [68, 2, 10, 68, 10, 14], { plank: DARK_LOG, post: DARK_LOG, batten: 3, leave: vents });

  // stripping shed lean-to posts on the west (x61), open front and sides
  for (const z of [9, 12, 15]) for (let y = 1; y <= 4; y++) g.set(61, y, z, ...B.log("stripped_spruce", "y"));
}

// ---- plot 6: the corn crib and the granary ----------------------------------------------------------------------
function crib(g) {
  // slatted crib on piers: x73..75, z9..16 (the front hatch is left for the openings part)
  slatCrib(g, 73, 9);
}

// Granary x77..82, z9..16, raised 1: cobblestone sill y1, oak walls y2..6, oak floor y1 inside.
function granary(g) {
  solid(g, [78, 1, 10, 81, 1, 15], OAK_PLANKS);
  ring(g, [77, 9, 82, 16], 1, COBBLE);

  boardWall(g, [77, 2, 9, 82, 6, 9], { plank: OAK_PLANKS, post: SLOG_OAK, batten: 3, leave: [[78, 2, 9, 79, 3, 9]] });
  boardWall(g, [77, 2, 16, 82, 6, 16], { plank: OAK_PLANKS, post: SLOG_OAK, batten: 3 });
  // west wall faces the crib: solid. east wall: one window at z12
  boardWall(g, [77, 2, 10, 77, 6, 15], { plank: OAK_PLANKS, post: SLOG_OAK, batten: 3 });
  boardWall(g, [82, 2, 10, 82, 6, 15], { plank: OAK_PLANKS, post: SLOG_OAK, batten: 3, leave: [[82, 3, 12, 82, 4, 12]] });
}

// ---- plot 7: the owner's brick house ----------------------------------------------------------------------------
// Body x85..92, z9..15, stone plinth y1, brick walls y2..10, calcite belt y6 (the upper floor line).
function owner(g) {
  const holes = [
    [89, 2, 9, 90, 4, 9], [90, 8, 9, 91, 9, 9],          // front door + transom, upper window pair
    [85, 3, 12, 85, 4, 12], [85, 8, 12, 85, 9, 12],      // west windows
    [92, 3, 11, 92, 4, 11], [92, 8, 11, 92, 9, 11],      // east windows
    [92, 3, 13, 92, 4, 13], [92, 8, 13, 92, 9, 13],
    [86, 7, 15, 87, 8, 15], [88, 3, 15, 88, 4, 15], [91, 2, 15, 91, 2, 15], // back: balcony doors, ground window, hearth mouth
  ];

  // stone plinth ring y1 and the parlour floor; the upper floor block y6 inside the belt
  ring(g, [85, 9, 92, 15], 1, STONE_BRICKS);
  solid(g, [86, 1, 10, 91, 1, 14], SPRUCE_PLANKS);
  // the upper floor, with the stair's headroom open at (86, 6, 13): the flight's step at z 13 needs it to jump onto z 12
  solid(g, [86, 6, 10, 91, 6, 14], SPRUCE_PLANKS, [[86, 6, 13, 86, 6, 13]]);

  // brick walls in two storeys, the belt course between (calcite, the floor line)
  skin(g, [85, 2, 9, 92, 5, 15], BRICKS, holes);
  skin(g, [85, 7, 9, 92, 10, 15], BRICKS, holes);
  ring(g, [85, 9, 92, 15], 6, CALCITE, holes);

  // front bay, glazed at y3..4 and y8..9 with the calcite panel between
  bayWindow(g, { x0: 85, x1: 88, z: 8, y0: 2, y1: 10 });
}

export function build(g) {
  church(g);
  barn(g);
  crib(g);
  granary(g);
  owner(g);
}
