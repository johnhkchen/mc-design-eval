// Part "shells plots 4-9": walls, plinth and decks for plots 4-9 (office O, bike shop S, coast guard C/C1-C4,
// OCC cross, garage G and G1-G4, boathouse B/B1 and lean-tos), x98..155. Openings from plan.md's OPENINGS table are
// left AIR here so the facade fittings can place glass and doors into them.
import { wallBox, floorDeck } from "../vocab.mjs";
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { WHITE_CONCRETE, STONE_BRICKS, QUARTZ_BLOCK, BIRCH_PLANKS } from "../vocab/base.mjs";

// a cross or L plan given as rects: the wall is the cells of the union with a neighbour outside it
function unionWalls(g, rects, y0, y1, mat, plinthMat) {
  const inside = new Set();
  for (const [x0, z0, x1, z1] of rects)
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) inside.add(`${x},${z}`);
  const has = (x, z) => inside.has(`${x},${z}`);
  const interior = [];
  for (const key of inside) {
    const [x, z] = key.split(",").map(Number);
    const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
    if (edge) {
      for (let y = y0; y <= y1; y++) g.set(x, y, z, y === y0 && plinthMat ? plinthMat : mat);
    } else interior.push([x, z]);
  }
  return interior;
}

export function build(g) {
  // ---- plot 4: SMALL OFFICE, x98..107 z0..9, two storeys, walls y1..4 ----
  wallBox(g, [98, 0, 107, 9], 1, 4, WHITE_CONCRETE, STONE_BRICKS);
  for (const [x, z] of [[98, 0], [107, 0], [98, 9], [107, 9]])
    for (let y = 1; y <= 4; y++) g.set(x, y, z, QUARTZ_BLOCK); // corner quoins, plan FACADES
  floorDeck(g, [99, 1, 106, 8], 3, BIRCH_PLANKS);
  carve(g, [102, 1, 0], [103, 2, 0]); // north door
  for (const y of [2, 4]) {
    for (const x of [99, 100, 105, 106]) carve(g, [x, y, 0], [x, y, 0]); // north windows
    for (const z of [2, 3, 6, 7]) {
      carve(g, [107, y, z], [107, y, z]); // east
      carve(g, [98, y, z], [98, y, z]); // west
    }
    for (const x of [100, 105]) carve(g, [x, y, 9], [x, y, 9]); // south
  }

  // ---- plot 5: BIKE SHOP, x108..117 z1..7 one tall storey, walls y1..5; piers on z0; side bay x118 ----
  wallBox(g, [108, 1, 117, 7], 1, 5, WHITE_CONCRETE, STONE_BRICKS);
  wallBox(g, [108, 0, 108, 0], 1, 5, WHITE_CONCRETE, STONE_BRICKS);
  wallBox(g, [117, 0, 117, 0], 1, 5, WHITE_CONCRETE, STONE_BRICKS);
  wallBox(g, [118, 4, 118, 5], 1, 3, WHITE_CONCRETE, STONE_BRICKS); // side bay, slab roof y4 by roofs-b
  carve(g, [109, 1, 1], [116, 3, 1]); // shopfront glass band and the double door (x112..113 y1..2)
  carve(g, [118, 1, 4], [118, 2, 4]); // side door

  // ---- plot 6: COAST GUARD STATION, C main z4..9, C1 pediment pavilion z0..3, C2 porch, C3/C4 lean-tos ----
  wallBox(g, [121, 4, 130, 9], 1, 4, WHITE_CONCRETE, STONE_BRICKS);
  floorDeck(g, [122, 5, 129, 8], 3, BIRCH_PLANKS);
  wallBox(g, [125, 0, 128, 3], 1, 4, WHITE_CONCRETE, STONE_BRICKS);
  floorDeck(g, [126, 1, 127, 2], 3, BIRCH_PLANKS);
  wallBox(g, [123, 2, 124, 3], 1, 2, WHITE_CONCRETE, STONE_BRICKS);
  wallBox(g, [119, 6, 120, 7], 1, 2, WHITE_CONCRETE, STONE_BRICKS);
  wallBox(g, [123, 10, 128, 11], 1, 2, WHITE_CONCRETE, STONE_BRICKS);
  carve(g, [126, 1, 0], [127, 2, 0]); // C1 main door
  carve(g, [125, 2, 0], [128, 2, 0]); // C1 windows at y2
  carve(g, [125, 4, 0], [128, 4, 0]); // C1 four-pane window at y4
  carve(g, [124, 1, 2], [124, 2, 2]); // C2 porch door
  carve(g, [121, 2, 4], [122, 2, 4]); // C north windows
  carve(g, [121, 4, 4], [122, 4, 4]);
  carve(g, [129, 2, 4], [130, 2, 4]);
  carve(g, [129, 4, 4], [130, 4, 4]);
  for (const z of [5, 8]) {
    carve(g, [130, 2, z], [130, 2, z]); // C east
    carve(g, [130, 4, z], [130, 4, z]);
  }
  carve(g, [121, 4, 5], [121, 4, 5]); // C west
  carve(g, [121, 2, 8], [121, 2, 9]);
  carve(g, [121, 4, 8], [121, 4, 9]);

  // ---- plot 7: OCEAN CLIMATE CENTER, cross plan: N-S arm x134..137 z0..7, E-W arm x132..139 z2..5 ----
  const occ = [[134, 0, 137, 7], [132, 2, 139, 5]];
  const occInterior = unionWalls(g, occ, 1, 4, WHITE_CONCRETE, STONE_BRICKS);
  for (const [x, z] of occInterior) g.set(x, 3, z, BIRCH_PLANKS); // upper deck over the interior cells
  carve(g, [135, 1, 0], [136, 2, 0]); // north door
  carve(g, [135, 4, 0], [136, 4, 0]); // north window pair
  for (const y of [2, 4]) {
    for (const z of [3, 4]) {
      carve(g, [132, y, z], [132, y, z]); // west arm end
      carve(g, [139, y, z], [139, y, z]); // east arm end
    }
    carve(g, [135, y, 7], [136, y, 7]); // south
  }

  // ---- plot 8: SHOP AND GARAGE, G garage x142..145 z0..5, G1-G4 lean-tos and bin ----
  wallBox(g, [142, 0, 145, 5], 1, 3, WHITE_CONCRETE, STONE_BRICKS);
  carve(g, [143, 1, 0], [144, 2, 0]); // wide garage door
  wallBox(g, [146, 2, 147, 7], 1, 2, WHITE_CONCRETE, STONE_BRICKS); // G1 east shop
  carve(g, [147, 1, 4], [147, 2, 4]); // G1 door
  wallBox(g, [144, 6, 145, 7], 1, 2, WHITE_CONCRETE, STONE_BRICKS); // G2 back
  wallBox(g, [140, 2, 141, 3], 1, 2, WHITE_CONCRETE, STONE_BRICKS); // G3 west
  wallBox(g, [146, 8, 147, 8], 1, 2, WHITE_CONCRETE, STONE_BRICKS); // G4 bin

  // ---- plot 9: 1890 BOATHOUSE, no plinth (wooden shed on the beach) ----
  wallBox(g, [151, 2, 154, 5], 1, 2, WHITE_CONCRETE); // B
  wallBox(g, [153, 0, 154, 1], 1, 2, WHITE_CONCRETE); // B1 door bay
  wallBox(g, [155, 2, 155, 3], 1, 2, WHITE_CONCRETE); // lean-to east
  wallBox(g, [149, 4, 150, 5], 1, 2, WHITE_CONCRETE); // lean-to west
  wallBox(g, [151, 6, 152, 7], 1, 2, WHITE_CONCRETE); // lean-to south
  carve(g, [153, 1, 0], [154, 2, 0]); // big boat door
  carve(g, [151, 2, 3], [151, 2, 3]); // west window
}
