// Part: Chimneys and hearths (parts/chimneys.mjs). The two chimney stacks on their own footings (x5..6 and x34..35,
// z17..18, y1..23) with a deepslate band, a stepped slab cap and a lit campfire on the corner of each cap; then the four
// fireplaces (x6 / x34, z17..18, y4..5 and y11..12) carved out of the stack's inner column, each with a campfire at the
// back, a stone_bricks hearth and an upside-down brick_stairs lintel. The shell leaves the stack cells as air.
import { chimneyStack, fireplace } from "../vocab.mjs";

const STACKS = [
  { x0: 5, side: "west", fire: 6 },
  { x0: 34, side: "east", fire: 34 },
];
const Z0 = 17;
const FLOORS = [4, 11]; // firebox bottoms: ground y4..5, upper y11..12

export function build(g) {
  for (const s of STACKS) chimneyStack(g, { x0: s.x0, z0: Z0, base: 1, cap: 23 });
  // The firebox cells sit inside the stack's inner column; open them before the hearths go in.
  for (const s of STACKS) for (const y0 of FLOORS) for (let y = y0; y <= y0 + 1; y++) for (let z = Z0; z <= Z0 + 1; z++) {
    g.set(s.fire, y, z, "minecraft:air");
  }
  for (const s of STACKS) for (const y0 of FLOORS) fireplace(g, s.fire, Z0, s.side, y0);
}
