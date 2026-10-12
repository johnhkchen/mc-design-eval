// PART 1: HOUSE SHELL (walls, plinth, floors, partitions, chimney breast). The roof is NOT built here: make.sh runs `mcd roof` after.
// Ticks elements.md: E1 (stone walls), E2 (two storeys), E4 (chimney breast), E5 (opening gaps), E31 (floors + partition).
// Import from ../vocab.mjs: HOUSE, OPENINGS, isOpening, frameCells, wallBlock, stoneFill, FLOOR_UP, BOARD, TRIM, PLINTH, BRICK, B.
//
// BUILD, in this order (all coordinates inclusive; ground block is y=0, so y=1 is the first built layer):
//  1. WALLS: the outer ring x=1..15, z=11..19, y=1..7. y=1 is PLINTH (cobblestone). y=2..7 is stoneFill (rough mixed stone).
//     Walls are 1 thick. For every cell that isOpening(x,y,z) is true, DO NOT SET IT (leave it unset: later parts fill the gap).
//  2. QUOINS: the four corner columns (1,11) (15,11) (1,19) (15,19), y=2..7, in TRIM (stone_bricks). Then for each OPENINGS entry
//     with kind window|door, set every cell of frameCells(o) in TRIM (jambs + lintel), skipping cells where isOpening() is true.
//     No band courses: keep it restrained, quoins + opening frames only.
//  3. FLOOR 1: interior x=2..14, z=12..18 at y=1 in BOARD (spruce_planks). This is the ground-floor surface (walk at y=2).
//  4. FLOOR 2: the same footprint at y=5 in FLOOR_UP (oak_planks), EXCEPT the stairwell: leave (x=2, y=5, z=14), (2,5,15), (2,5,16) UNSET
//     (the interior part puts stairs there). The upper-floor surface is walk-at y=6.
//  5. PARTITION x=9, z=12..18, y=2..4 and y=6..7 (y=5 is the floor) in BOARD (spruce_planks). Doorways: leave isOpening cells unset
//     (OPENINGS has them at (9,2..3,13) and (9,6..7,13)).
//  6. CHIMNEY BREAST: bricks (BRICK) at x=9..10, z=14..15, y=2..7 (this lines up with the 2x2 brick chimney `mcd roof` builds at
//     x=9..10,z=14..15 above y=8). EXCEPT the hearth niche: leave (10,2,15) and (10,3,15) UNSET (interior part puts the campfire at (10,2,15)).
//     (10,4,15) and above stay bricks. The breast overwrites the partition at its cells (same part, intended).
//  7. Do NOT build anything at y>=8 inside x=0..16, z=10..20 (the roof step owns it). Do NOT build the porch (part 2).
// Check: node build.mjs then `node <mcd> render build.nbt` and look at the front elevation: rough stone, quoins, gaps where windows go.
import { HOUSE, OPENINGS, isOpening, frameCells, wallBlock, stoneFill, FLOOR_UP, BOARD, TRIM, PLINTH, BRICK, B } from "../vocab.mjs";

export function build(g) {
  // 1. WALLS: outer ring x=1..15, z=11..19, y=1..7. y=1 plinth, y=2..7 stoneFill.
  for (let x = HOUSE.x0; x <= HOUSE.x1; x++) {
    for (let z = HOUSE.z0; z <= HOUSE.z1; z++) {
      for (let y = HOUSE.floor1; y <= HOUSE.eave; y++) {
        // Skip opening cells (left for later parts)
        if (isOpening(x, y, z)) continue;

        // Only build the outer ring (1 thick)
        const onPerimeter = x === HOUSE.x0 || x === HOUSE.x1 || z === HOUSE.z0 || z === HOUSE.z1;
        if (!onPerimeter) continue;

        if (y === HOUSE.floor1) {
          g.set(x, y, z, PLINTH);
        } else {
          g.set(x, y, z, wallBlock(x, y, z));
        }
      }
    }
  }

  // 2. QUOINS: four corners in TRIM (stone_bricks), y=2..7
  const corners = [[HOUSE.x0, HOUSE.z0], [HOUSE.x1, HOUSE.z0], [HOUSE.x0, HOUSE.z1], [HOUSE.x1, HOUSE.z1]];
  for (const [x, z] of corners) {
    for (let y = 2; y <= HOUSE.eave; y++) {
      g.set(x, y, z, TRIM);
    }
  }

  // 2b. OPENING FRAMES: jambs and lintels for each window/door
  for (const o of OPENINGS) {
    for (const [fx, fy, fz, fblock] of frameCells(o)) {
      if (!isOpening(fx, fy, fz)) {
        g.set(fx, fy, fz, fblock);
      }
    }
  }

  // 3. FLOOR 1: spruce_planks y=1, interior x=2..14, z=12..18
  for (let x = 2; x <= 14; x++) {
    for (let z = 12; z <= 18; z++) {
      g.set(x, HOUSE.floor1, z, BOARD);
    }
  }

  // 4. FLOOR 2: oak_planks y=5, same interior footprint, except stairwell
  const stairwellCells = new Set();
  stairwellCells.add("2,5,14");
  stairwellCells.add("2,5,15");
  stairwellCells.add("2,5,16");
  for (let x = 2; x <= 14; x++) {
    for (let z = 12; z <= 18; z++) {
      if (!stairwellCells.has(`${x},${HOUSE.floor2},${z}`)) {
        g.set(x, HOUSE.floor2, z, FLOOR_UP);
      }
    }
  }

  // 5. PARTITION: x=9, z=12..18, y=2..4 and y=6..7, spruce_planks, skip doorways
  for (let z = 12; z <= 18; z++) {
    for (let y = 2; y <= 4; y++) {
      if (!isOpening(9, y, z)) {
        g.set(9, y, z, BOARD);
      }
    }
    for (let y = 6; y <= 7; y++) {
      if (!isOpening(9, y, z)) {
        g.set(9, y, z, BOARD);
      }
    }
  }

  // 6. CHIMNEY BREAST: bricks x=9..10, z=14..15, y=2..7, skip hearth niche
  const nicheCells = new Set();
  nicheCells.add("10,2,15");
  nicheCells.add("10,3,15");
  for (let x = 9; x <= 10; x++) {
    for (let z = 14; z <= 15; z++) {
      for (let y = 2; y <= 7; y++) {
        if (!nicheCells.has(`${x},${y},${z}`)) {
          g.set(x, y, z, BRICK);
        }
      }
    }
  }
}
