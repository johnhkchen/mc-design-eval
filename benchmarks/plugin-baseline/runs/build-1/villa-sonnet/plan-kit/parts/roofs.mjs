// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   All 16 roof pieces R1..R16 from the plan table, at y7..9 (first roof course on the y6 cornice). Use `mcd roof`
//   or roof() with the temple preset as a base (red-tile palette) and the per-piece style, ridge and low-side
//   overrides: gables on R1..R3 and R8..R10, R15, R16; sheds on R4..R7 (atrium pinwheel) and R11..R14 (peristyle
//   pinwheel), low edge toward the court. Dry-run first, no bypass flags except the documented `--why` for overhang
//   0; overhang only on R1 north (1). Keep the compluvium hole x14..21,z13..18 and the garden hole x11..24,z35..41
//   open. Then the fauces pediment (x14..21, y7..9, z=2..3, quartz stairs and smooth_quartz) and the kitchen chimney
//   stack (hollow 3x3 stone_bricks x1..3,z25..27,y6..9, core (2,6..9,26) air).
//
// plan.md PARTS entry:
//   2. P2 `parts/roofs.mjs` - ROOFS. All 16 pieces in the table, via `mcd roof` / `roof()` with preset `temple` +
//   overrides, dry-run first; compluvium and garden holes open; pediment (E30); kitchen chimney stack (E31). Ticks
//   E20, E30, E31.
export function build(g) {}
