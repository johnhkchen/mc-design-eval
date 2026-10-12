// Openings (plan.md OPENINGS; elements 3, 9, 15, 17, 35): the back sills and hoods (z33).
// The glass and doors are NOT placed here: the shell carves every opening to air and runParts locks those cells
// (air included), so each window and door write was refused. Restoring them needs the shell to leave the opening
// cells unowned. The removed glass and door calls are in /tmp/probe5/openings.orig.mjs.
import { BACK_Z, sill, hood } from "../vocab.mjs";

export function build(g) {
  // Back sills and hoods (z33). Sills sit one row under each window; hoods one row over it.
  const TRIM = BACK_Z + 1;
  for (const [x0, x1, y0, y1] of [[3, 4, 5, 7], [11, 12, 5, 7], [3, 4, 9, 11], [7, 8, 9, 11], [11, 11, 10, 11]]) {
    sill(g, x0, x1, y0, TRIM);
    hood(g, x0, x1, y1 + 1, TRIM);
  }
  sill(g, 7, 8, 13, TRIM);                                                   // top room: the back-eave stairs course (y16) is its hood, so no slab here
  sill(g, 7, 8, 2, TRIM);                                                    // garden store: no hood (its row is the deck floor)
  hood(g, 7, 8, 8, TRIM);                                                    // over the French doors
}
