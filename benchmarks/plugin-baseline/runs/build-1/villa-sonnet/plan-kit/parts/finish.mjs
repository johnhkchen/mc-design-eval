// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   copper_bars windowGrilles in every x=0 and x=35 window (z=12, 18, 26, 35) and the back-wall windows (3,3..4,45)
//   and (32,3..4,45). Rear doorPair at (17..18,2..3,45) and the rear lane z46..47 (gravel 70 / dirt_path 30),
//   lampstands at (16,44),(19,44), pots at (16,46),(19,46). Remaining potted plants:
//   (14,32),(21,32),(9,33),(26,33),(9,43),(26,43). Then render from the street, down the axis, and from above, and
//   fix what fell between the parts.
//
// plan.md PARTS entry:
//   6. P6 `parts/finish.mjs` - FINISH. Window grilles on all x=0/x=35/z=45 windows, rear door pair and rear lane,
//   back-wall windows, remaining lampstands and pots, final look: render from the street, down the axis (`--eye
//   17.5,3.6,0 --look 17.5,3.6,40`), and from above. Ticks E24, E25, E26, E28, E27 (shell only).
export function build(g) {}
