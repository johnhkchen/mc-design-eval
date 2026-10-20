// Plaza and grounds (plan.md: Plaza and steps, Lamp posts; elements 17-20): the paved north plaza and monorail street at
// grade, the amphitheatre steps, the planting beds on the east and west edges, the south-east birch garden and the lamp
// posts. Everything here is ground (y0) or sits on it (y1 and up) in cells the shells leave open; the build library refuses
// any write into an earlier part's cell, so the footprint clips below only keep the attempts tidy.
import { plaza, tiers, bed, birchTree, lampPost } from "../vocab.mjs";
import { inFootprint } from "../vocab/base.mjs";

export function build(g) {
  // North plaza paving: every open cell of z 0..25, the entrance landing (x 26..42, z 14..21) and the monorail street
  // (x 43..51, the arcade at grade), with the polished_andesite / light_gray_concrete bands every 6 in x. The L1
  // entrance lobby (x 26..42, z 22..36) already paved its own ground in the lobbies part, so the plaza leaves it alone.
  plaza(g, {
    mask: (x, z) =>
      (z <= 25 && !inFootprint(x, z) && !(x >= 26 && x <= 42 && z >= 22 && z <= 36)) ||
      (z >= 14 && z <= 21 && x >= 26 && x <= 42) ||
      (x >= 43 && x <= 51),
    band: 6,
  });

  // Amphitheatre steps (x 4..40, z 4..13): tiers rising to the north, andesite_wall rails at x 4 and x 40.
  tiers(g, { x0: 4, x1: 40, z0: 4, z1: 13, y0: 1 });
  // A rail cannot stand on a bottom slab (half a block of air under it): under each rail the tier's slab becomes a full block.
  for (const x of [4, 40]) for (let z = 4; z <= 13; z++) for (let y = 2; y <= 5; y++) {
    const rail = g.get(x, y, z);
    const below = g.get(x, y - 1, z);
    if (rail?.block?.includes("andesite_wall") && below?.block?.includes("slab")) g.set(x, y - 1, z, "polished_andesite");
  }

  // Planting beds on the open edges (each box is outside the footprint mask, so the kerb stays on open ground).
  bed(g, { box: [0, 0, 11, 3] });        // north-west corner, by the street
  bed(g, { box: [0, 100, 3, 111] });     // west edge, south of the red and gold forms
  bed(g, { box: [94, 0, 101, 3] });      // north-east corner
  bed(g, { box: [98, 8, 101, 11] });     // east edge beside the blue form

  // South-east garden: grass with birch trees (plan: x 72..101 z 144..152, x 84..101 z 140..143, x 92..101 z 108..139).
  bed(g, { box: [72, 144, 101, 152] });
  bed(g, { box: [84, 140, 101, 143] });
  bed(g, { box: [92, 108, 101, 139] });
  for (const [x, z] of [[78, 146], [86, 150], [96, 146], [94, 138], [96, 126], [94, 112]]) {
    birchTree(g, { x, z, y: 1 });
  }

  // Lamp posts: at the gate beside the landing, along the north plaza, down the monorail street (y1..4 only, clear of
  // the corridor y8..17 and the pylon columns at x 46..47), and on the east street edge.
  for (const [x, z] of [
    [26, 14], [41, 14],                     // gate, either side of the landing
    [14, 2], [30, 2], [41, 2],              // north plaza
    [44, 2], [50, 2], [44, 20], [50, 20], [44, 40], [50, 40], // monorail street
    [53, 2], [53, 10],                      // east edge of the north plaza
  ]) {
    lampPost(g, { x, z });
  }
}
