// Part "chimneys" (parts/chimneys.mjs): three 2x2 brick stacks from y 6 to y 33 on their own footings, each with a trim band
// at y 30 and a slab cap ring at y 33 stepping out one. W and E carry a hay_block signal base and a lit signal campfire in
// the flue (smoke rises from the mouth); C is capped with no fire. Coordinates are plan.md CHIMNEYS (footprint x0,z0..x1,z1).
// Writes go into air only (the roof part keeps the stack cells, so the stacks pass through the roof).
import { chimney, CHIMNEYS, CAMPFIRE } from "../vocab.mjs";

export function build(g) {
  // W and E: smoke from the mouth. The flue is the cell (x1, z1) of the footing.
  for (const key of ["W", "E"]) {
    const c = CHIMNEYS[key];
    chimney(g, c.x0, c.z0, { fire: true });
    // The helper's campfire has no signal_fire state; a structure file keeps the state written, so set it here.
    g.set(c.x1, 33, c.z1, CAMPFIRE, { facing: "north", lit: "true", signal_fire: "true" });
  }
  // C: rear breast in the yard, capped, no fire.
  const c = CHIMNEYS.C;
  chimney(g, c.x0, c.z0, { fire: false });
}
