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
  // TODO(worker): implement the spec above.
}
